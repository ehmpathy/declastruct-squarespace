# self-review: role-standards-coverage (r8)

## review approach

for each file, examine line by line. for each pattern, articulate not just "is it present" but "why this pattern matters here and why the implementation satisfies the intent."

---

## rule directories checked

| directory | why relevant |
|-----------|--------------|
| code.prod/evolvable.domain.objects/ | nameservers is a domain entity with refs |
| code.prod/evolvable.procedures/ | operations use hook wrapper, input-context |
| code.prod/pitofsuccess.errors/ | validation paths must failfast |
| code.prod/pitofsuccess.procedures/ | setNameservers must be idempotent |
| code.prod/readable.narrative/ | scrapers have complex control flow |
| code.test/frames.behavior/ | integration tests verify blackbox criteria |
| code.test/scope.coverage/ | each grain needs appropriate test type |

---

## DeclaredSquarespaceDomainNameservers.ts

### RefByUnique for domain reference

**why this pattern matters:** domain objects that reference other entities must use typed refs so that:
1. intellisense shows exactly which properties are needed
2. callers cannot accidentally pass wrong shape
3. the reference type documents the relationship

**why the implementation satisfies the intent:**

line 14:
```typescript
domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>;
```

- `RefByUnique` not `RefByPrimary` because squarespace identifies domains by name, not by internal ID
- `typeof DeclaredSquarespaceDomainRegistration` ties the reference to the actual entity class
- when you hover over `domain`, IDE shows `{ name: string }` — exactly what squarespace needs

### null semantics for nameservers

**why this pattern matters:** `string[] | null` is not `string[] | undefined`. the distinction:
- `null` = explicitly "use squarespace default" (intentional state)
- `undefined` = "not set" (absent state)
- empty array `[]` = ambiguous (could mean either)

**why the implementation satisfies the intent:**

lines 17-21:
```typescript
/**
 * .note - null = squarespace default nameservers, [...] = custom nameservers
 */
nameservers: string[] | null;
```

the JSDoc makes semantics explicit. `null` is not "absent" — it's "managed by squarespace." this prevents callers from confusion between default state and error state.

### unique key is [domain]

**why this pattern matters:** the unique key determines:
1. how findsert/upsert find extant records
2. whether duplicate records can exist
3. the natural key for the entity

**why the implementation satisfies the intent:**

line 27:
```typescript
public static unique = ['domain'] as const;
```

one domain can have only one nameserver configuration. DNS semantics allow exactly one NS record set per domain. if `unique` were empty, multiple nameserver configs per domain would be allowed — which is wrong.

---

## getNameservers.ts

### hook wrapper pattern with reusePageKey

**why this pattern matters:** browser operations are expensive. the wrapper:
1. acquires a logged-in page from the pool
2. passes it to the core function
3. returns the page to the pool when done
4. `reusePageKey` enables page reuse across operations on the same domain type

**why the implementation satisfies the intent:**

lines 46-52:
```typescript
export const getNameservers = withNewLoggedInBrowserPage(
  getNameserversCore,
  { reusePageKey: 'domainNameservers' },
);
```

the key `'domainNameservers'` means get and set operations on nameservers can share a page. the wrapper handles login, session management, and cleanup — core function only does scrape logic.

### RefByUnique.as in domain object construction

**why this pattern matters:** when you construct a domain object, the domain ref must be typed. a bag ref like `{ name: 'example.com' }` loses type safety.

**why the implementation satisfies the intent:**

lines 35-37:
```typescript
domain: RefByUnique.as<typeof DeclaredSquarespaceDomainRegistration>({
  name: input.by.unique.domain.name,
}),
```

`RefByUnique.as<...>` provides:
1. type check at compile time — if DeclaredSquarespaceDomainRegistration.unique changes, this breaks
2. intellisense for callers — they see exactly what properties are required
3. consistency — all refs constructed the same way across codebase

---

## setNameservers.ts

### idempotent check before mutation

**why this pattern matters:** idempotency is required by rule.require.idempotent-procedures. if the current state already matches the desired state:
1. skip the mutation (no UI interaction)
2. return early (faster)
3. no side effects (safe to retry)

**why the implementation satisfies the intent:**

lines 38-51:
```typescript
// check if change is needed
const currentSerialized = serialize(currentNameservers.nameservers);
const desiredSerialized = serialize(nameserversValidated);
const noChangeNeeded = currentSerialized === desiredSerialized;

// for findsert, return current state if no change needed
if (input.findsert && noChangeNeeded) {
  return currentNameservers;
}

// for upsert, also skip if no change needed
if (noChangeNeeded) {
  return currentNameservers;
}
```

`serialize()` from domain-objects handles comparison of `string[] | null`. the check happens BEFORE browser page is acquired, so unnecessary UI interactions are avoided.

### validation before page access

**why this pattern matters:** failfast means invalid input throws BEFORE expensive operations. if validation happens after browser login, we waste time on invalid requests.

**why the implementation satisfies the intent:**

line 94:
```typescript
// validate nameservers input early (before page access)
validateNameserversInput({ nameservers: desired.nameservers });
```

validation happens in `setNameserversWithPage`, BEFORE `withNewLoggedInBrowserPage` is called. invalid input fails immediately with clear error — no browser session wasted.

### deadlock prevention via sequential bottleneck use

**why this pattern matters:** `withNewLoggedInBrowserPage` uses `maxConcurrent: 1` (bottleneck). if `getNameservers` is called INSIDE the page wrapper, both operations compete for the same bottleneck — deadlock.

**why the implementation satisfies the intent:**

lines 96-100:
```typescript
// fetch current state OUTSIDE page wrapper to avoid bottleneck deadlock
const currentNameservers = await getNameservers(
  { by: { unique: { domain: { name: desired.domain.name } } } },
  context,
);
```

the JSDoc comment explains WHY: "getNameservers MUST be called OUTSIDE withNewLoggedInBrowserPage to avoid re-entrant bottleneck deadlock."

---

## validateNameserversInput.ts

### min 2, max 13 nameservers

**why this pattern matters:** DNS has real constraints:
- min 2: redundancy required (single NS is single point of failure)
- max 13: RFC 1035 limits NS response to 512 bytes; 13 NS at ~40 bytes each approaches limit

**why the implementation satisfies the intent:**

lines 30-43:
```typescript
if (input.nameservers.length < 2) {
  throw new BadRequestError('minimum 2 nameservers required', {
    count: input.nameservers.length,
    nameservers: input.nameservers,
  });
}

if (input.nameservers.length > 13) {
  throw new BadRequestError('maximum 13 nameservers allowed', {
    count: input.nameservers.length,
    hint: 'RFC 1035 limits NS records to 13',
  });
}
```

both errors include context (count, nameservers) so caller can fix. the hint explains WHY 13 is the limit — not arbitrary, RFC-based.

### empty array to null conversion

**why this pattern matters:** empty array `[]` is ambiguous. does it mean "no nameservers" (invalid) or "use default" (valid)? the conversion to null eliminates ambiguity.

**why the implementation satisfies the intent:**

lines 26-27:
```typescript
// treat empty array as null (squarespace default)
if (input.nameservers.length === 0) return null;
```

callers who pass `[]` get squarespace default — the only valid interpretation. this prevents "empty array" from being confused with "no nameservers configured."

---

## setNameserversScraper.ts

### separate if guards instead of else

**why this pattern matters:** rule.forbid.else-branches exists because else hides the condition. with separate if guards:
1. each condition is explicit and visible
2. reader sees both conditions without mental inversion
3. early returns make flow clear

**why the implementation satisfies the intent:**

lines 43-91 (reset logic):
```typescript
// handle reset to squarespace default
if (nameservers === null) {
  // ... reset logic ...
}
```

lines 91-172 (custom NS logic):
```typescript
// handle custom nameservers
if (nameservers !== null) {
  // ... custom NS logic ...
}
```

both conditions are explicit. reader doesn't have to mentally invert `nameservers === null` to understand the second block.

### verification after mutation

**why this pattern matters:** rule.require.action-verification requires positive confirmation. a click on "Save" doesn't prove the change happened — the page could error silently.

**why the implementation satisfies the intent:**

lines 174-223:
```typescript
// verify result by read of nameservers from page
await page.reload();
await waitForSquarespaceReactRender({
  page,
  forContent: domainDetailSelectors.nameserversSection,
});

// determine if squarespace default or custom via button visibility
const resetButtonVisible = await page
  .locator(domainDetailSelectors.useSquarespaceNameserversButton)
  .first()
  .isVisible();
const isSquarespaceDefault = !resetButtonVisible;
```

after mutation, page reloads and reads back the state. this confirms:
1. the change was accepted by squarespace
2. the final state matches what we expect

---

## test coverage by grain

### transformers (unit tests)

| transformer | test file | why unit test |
|-------------|-----------|---------------|
| validateNameserversInput | validateNameserversInput.test.ts | pure function, no deps |
| castIntoDeclaredSquarespaceDomainNameservers | castIntoDeclaredSquarespaceDomainNameservers.test.ts | pure transformation |

**why unit tests:** transformers are pure — input → output, deterministic. no mocks needed, no i/o.

### communicators (integration tests)

| communicator | test file | why integration test |
|--------------|-----------|---------------------|
| getNameserversScraper | tested via getNameservers.integration.test.ts | requires real browser, real squarespace |
| setNameserversScraper | tested via setNameservers.play.integration.test.ts | requires real browser, real squarespace |

**why integration tests:** communicators are i/o boundaries. they must verify real connections work.

### orchestrators (integration tests)

| orchestrator | test file | why integration test |
|--------------|-----------|---------------------|
| getNameservers | getNameservers.integration.test.ts | composes scraper + transform |
| setNameservers | setNameservers.play.integration.test.ts | composes validation + get + scraper |

**why integration tests:** orchestrators compose multiple operations. end-to-end verification ensures the composition works.

---

## gaps found

none. all mechanic standards are covered with appropriate depth.

---

## conclusion

each pattern is present AND satisfies its intent:
1. **RefByUnique** — typed refs prevent bag ref mistakes
2. **null semantics** — explicit distinction from undefined/empty
3. **hook wrapper** — browser lifecycle managed, page reuse enabled
4. **idempotent check** — skip mutation when state matches
5. **validation first** — fail before expensive operations
6. **deadlock prevention** — sequential bottleneck use, not nested
7. **separate if guards** — explicit conditions, no hidden else
8. **verification** — read back state after mutation
9. **test by grain** — unit for transformers, integration for communicators/orchestrators

full coverage verified.
