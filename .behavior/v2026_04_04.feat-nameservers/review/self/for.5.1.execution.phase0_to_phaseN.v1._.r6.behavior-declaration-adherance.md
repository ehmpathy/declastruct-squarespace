# self-review: behavior-declaration-adherance (r6)

## review approach

deep dive into each implementation aspect. for each item: why it holds (not just that it holds).

---

## domain object: why it adheres

### RefByUnique for domain reference

**vision requirement**: `domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>`

**implementation** (line 14):
```typescript
domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>;
```

**why it holds**: `RefByUnique` is the correct choice because:
1. nameservers are identified by domain name, not by database ID
2. the domain reference uses `name` as the unique key (matches DeclaredSquarespaceDomainRegistration.unique)
3. squarespace UI operates on domain name, not internal IDs
4. `RefByPrimary` would require an ID that squarespace's UI doesn't expose

---

### nameservers: string[] | null semantics

**vision requirement**: null = squarespace default, [...] = custom

**implementation** (lines 17-21):
```typescript
/**
 * .note - null = squarespace default nameservers, [...] = custom nameservers
 */
nameservers: string[] | null;
```

**why it holds**: the null vs array distinction is semantically correct because:
1. squarespace's default nameservers are NOT "no nameservers" — they're googledomains.com servers
2. an empty array would incorrectly suggest "no nameservers configured"
3. null communicates "managed by squarespace" which is the actual state
4. the type `string[] | null` prevents the ambiguous empty array state at the type level

---

### unique key is [domain]

**implementation** (line 27):
```typescript
public static unique = ['domain'] as const;
```

**why it holds**: one domain can have only one nameserver configuration because:
1. DNS semantically allows only one set of NS records per domain
2. squarespace's UI has exactly one nameservers page per domain
3. the findsert/upsert pattern relies on unique key for idempotency
4. if unique was empty, multiple records per domain would be allowed (wrong)

---

## DAO: why it adheres

### set.delete is null

**vision requirement**: delete not supported, reset via upsert with null

**implementation** (line 41):
```typescript
delete: null,
```

**why it holds**: nameserver config cannot be "deleted" because:
1. every domain MUST have nameservers (DNS requirement)
2. squarespace does not have a "remove nameservers" option
3. the equivalent of "delete" is "reset to squarespace default" which is `upsert({ nameservers: null })`
4. delete exposure would mislead callers into false expectations about removal

---

### get.one.byPrimary is null

**implementation** (line 21):
```typescript
byPrimary: null,
```

**why it holds**: byPrimary lookup is not supported because:
1. squarespace's UI navigates by domain name, not by ID
2. there is no stable primary key exposed by squarespace
3. the domain entity uses `domain.name` as the navigation key
4. byUnique-only prevents callers from false assumptions about ID-based lookup

---

## validation: why it adheres

### minimum 2 nameservers

**criteria requirement**: fewer than 2 NS fails with clear error

**implementation** (lines 30-35):
```typescript
if (input.nameservers.length < 2) {
  throw new BadRequestError('minimum 2 nameservers required', {
    count: input.nameservers.length,
    nameservers: input.nameservers,
  });
}
```

**why it holds**: the minimum is correct because:
1. DNS best practice requires at least 2 NS for redundancy
2. squarespace's UI has 2 input fields minimum
3. a single nameserver would be a single point of failure
4. the error message is actionable: tells caller what's wrong and includes context

---

### maximum 13 nameservers

**criteria requirement**: validation must exist for max NS

**implementation** (lines 38-43):
```typescript
if (input.nameservers.length > 13) {
  throw new BadRequestError('maximum 13 nameservers allowed', {
    count: input.nameservers.length,
    hint: 'RFC 1035 limits NS records to 13',
  });
}
```

**why it holds**: RFC 1035 constraint because:
1. DNS protocol limits NS record response to 512 bytes
2. 13 NS records at ~40 bytes each approaches this limit
3. squarespace would likely reject more than 13
4. early validation prevents unclear UI errors

---

### empty array to null conversion

**criteria requirement**: `[]` treated as null

**implementation** (lines 26-27):
```typescript
if (input.nameservers.length === 0) return null;
```

**why it holds**: empty array must convert to null because:
1. empty array is ambiguous: does it mean "no NS" or "use default"?
2. since "no NS" is invalid (DNS requires NS records), empty must mean "default"
3. conversion at validation prevents this ambiguity from propagation
4. callers who pass `[]` get squarespace default, which is the only valid interpretation

---

## scraper: why it adheres

### button visibility for null detection

**implementation** in getNameserversScraper.ts (lines 41-45):
```typescript
const resetButtonVisible = await page
  .locator(domainDetailSelectors.useSquarespaceNameserversButton)
  .first()
  .isVisible();
const isSquarespaceDefault = !resetButtonVisible;
```

**why it holds**: button visibility is the correct signal because:
1. squarespace shows "USE SQUARESPACE NAMESERVERS" only when custom NS are set
2. squarespace shows "USE CUSTOM NAMESERVERS" when on default
3. the actual NS values (ns1.googledomains.com) don't distinguish custom vs default
4. button visibility is squarespace's own UI signal for this state

---

### deviation: getNameserversScraper instead of scrapeDomainDetail

**blueprint said**: GET reuses `scrapeDomainDetail`

**implementation**: separate `getNameserversScraper.ts`

**why this deviation is correct**:
1. `scrapeDomainDetail` operates on `/domains/managed/{domain}` (main detail page)
2. null detection requires `/dns/domain-nameservers` (nameservers page)
3. button visibility check only exists on nameservers page
4. `scrapeDomainDetail` returns `string[]` always — cannot return `null`
5. reuse would require modification of its return type (breaks other callers)
6. separate scraper preserves single responsibility

**evidence**: `scrapeDomainDetail` at line ~89-97 always returns array:
```typescript
const nameservers: string[] = [];
for (const ns of nameserverElements) {
  const value = await ns.textContent();
  if (value) nameservers.push(value.trim());
}
```

this cannot distinguish "custom cloudflare NS" from "squarespace default googledomains NS" — both return arrays.

---

## tests: why they adhere

### journey test covers full cycle

**implementation** in setNameservers.play.integration.test.ts:

```
t0: start from known state (null)
t1: upsert to cloudflare
t2: verify via get
t3: upsert back to null
t4: verify via get
```

**why it holds**: this is a complete round-trip because:
1. starts from squarespace default (null)
2. transitions to custom (cloudflare)
3. verifies the transition persisted
4. transitions back to default
5. verifies the reset persisted
6. any broken step would fail downstream tests

---

### findsert test verifies no-op behavior

**implementation** (case2/t0):
```typescript
const ns = await setNameservers({
  findsert: {
    domain: { name: TEST_DOMAIN },
    nameservers: current.nameservers,
  },
}, context);

then('returns extant entity unchanged', () => {
  expect(result.ns.nameservers).toEqual(result.current.nameservers);
});
```

**why it holds**: findsert semantics require:
1. if state matches, return extant (no mutation)
2. test compares before/after to prove no change
3. duration check proves no UI interaction occurred
4. this matches declastruct findsert pattern (find-or-insert)

---

## conclusion

implementation adheres because:
1. **domain object**: RefByUnique correct for name-based navigation, null semantics correct for default distinction
2. **DAO**: delete null prevents invalid "remove NS" calls, byPrimary null prevents unsupported lookups
3. **validation**: RFC 1035 constraints, empty array to null conversion, actionable error messages
4. **scraper**: button visibility is squarespace's own signal for default vs custom
5. **deviation**: separate scraper justified by page URL and return type requirements
6. **tests**: full round-trip journey, findsert no-op verification

no drift found. each aspect holds for specific technical reasons.
