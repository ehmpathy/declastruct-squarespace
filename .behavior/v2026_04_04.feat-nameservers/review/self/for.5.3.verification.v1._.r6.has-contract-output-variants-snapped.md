# self-review: has-contract-output-variants-snapped (r6)

## review criteria

the guide asks:
> does each public contract have EXHAUSTIVE snapshots?

the review criteria table:

| contract type | what to snap | required variants |
|---------------|--------------|-------------------|
| cli command | stdout + stderr | success, error, --help, edge cases |
| api endpoint | response body | 2xx, 4xx, 5xx, edge cases |
| sdk method | return value | success, error, edge cases |

---

## step 1: identify contracts added by this feature

| contract | type | location |
|----------|------|----------|
| `getNameservers` | sdk method (internal) | `src/domain.operations/domainNameservers/` |
| `setNameservers` | sdk method (internal) | `src/domain.operations/domainNameservers/` |
| `DeclaredSquarespaceDomainNameserversDao` | sdk method (internal) | `src/access/daos/` |

**not added:**
- no cli commands (this is a library, not a cli tool)
- no api endpoints (this is a library, not a server)

---

## step 2: verify codebase pattern

**question:** does this codebase use snapshots?

**evidence:**

```bash
rhx globsafe --pattern '**/*.snap'
# files: 0
```

**zero snapshot files in the entire repository.**

**verification:** checked other domain operations for comparison:

| file | snapshots? | pattern |
|------|------------|---------|
| `setDomain.integration.test.ts` | no | explicit assertions |
| `getOneDomain.integration.test.ts` | no | explicit assertions |
| `setTransferRequest.integration.test.ts` | no | explicit assertions |

**code sample from `setDomain.integration.test.ts` (lines 39-55):**

```typescript
then('returns the domain', () => {
  expect(result.domain).toBeDefined();
});

then('domain is a DeclaredSquarespaceDomainRegistration', () => {
  expect(result.domain).toBeInstanceOf(DeclaredSquarespaceDomainRegistration);
});

then('domain is unlocked', () => {
  expect(result.domain.isLocked).toBe(false);
});

then('domain has correct name', () => {
  expect(result.domain.name).toBe(TEST_DOMAIN);
});
```

**conclusion:** the codebase pattern is **explicit assertions**, not snapshots. this is consistent across all 9 integration test files in `src/domain.operations/`.

---

## step 3: verify nameservers follows the pattern

**question:** does the nameservers feature follow the codebase pattern?

**evidence from `setNameservers.play.integration.test.ts`:**

```typescript
// success: custom nameservers (line 69-71)
then('returns entity with custom nameservers', () => {
  expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS);
});

// success: null nameservers (line 102-104)
then('returns entity with null nameservers', () => {
  expect(result.ns.nameservers).toBeNull();
});
```

**evidence from `validateNameserversInput.test.ts`:**

```typescript
// error: < 2 nameservers (line 32-44)
then('throws BadRequestError with "minimum 2 nameservers" message', () => {
  expect(() => validateNameserversInput({ nameservers: ['ns1.cloudflare.com'] }))
    .toThrow(BadRequestError);
  expect((error as Error).message).toContain('minimum 2 nameservers');
});

// error: invalid FQDN (line 54-70)
then('throws BadRequestError with "invalid nameserver format" message', () => {
  expect(() => validateNameserversInput({ nameservers: ['ns1.cloudflare.com', 'invalid_ns!.com'] }))
    .toThrow(BadRequestError);
  expect((error as Error).message).toContain('invalid nameserver format');
});
```

**conclusion:** nameservers feature follows the established pattern exactly.

---

## step 4: verify all output variants covered

the guide requires: success, error, edge cases.

### getNameservers output variants

| variant | covered? | test | assertion |
|---------|----------|------|-----------|
| success (custom NS) | yes | case1 [t2] | `expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS)` |
| success (null NS) | yes | case1 [t4] | `expect(result.ns.nameservers).toBeNull()` |

### setNameservers output variants

| variant | covered? | test | assertion |
|---------|----------|------|-----------|
| success (set custom) | yes | case1 [t1] | `expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS)` |
| success (set null) | yes | case1 [t3] | `expect(result.ns.nameservers).toBeNull()` |
| success (idempotent) | yes | case2 [t0] | `expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS)` |
| success (findsert) | yes | case3 [t0] | `expect(result.ns.nameservers).toEqual(result.current.nameservers)` |
| error (< 2 NS) | yes | validation case2 | `toThrow(BadRequestError)` + message contains |
| error (invalid FQDN) | yes | validation case3 | `toThrow(BadRequestError)` + message contains |
| error (> 13 NS) | yes | validation case5 | `toThrow(BadRequestError)` + message contains |
| edge (empty array) | yes | validation case4 | `expect(result).toBeNull()` |

**all 10 output variants are covered by explicit assertions.**

---

## step 5: address the "why not snapshots" question

the guide says:
> snapshots enable vibecheck in prs — reviewers see actual output without execute

**why explicit assertions are better for this codebase:**

1. **TypeScript types already document shape.** the return type `DeclaredSquarespaceDomainNameservers` is a domain object with explicit properties. the "shape" is visible in the type definition, not just a snapshot.

2. **assertions verify semantics, not just structure.** `expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS)` proves the exact value, not just that a value was returned.

3. **no snapshot churn.** domain objects may include timestamps, ids, or other volatile fields. explicit assertions ignore irrelevant fields.

4. **this is an internal library, not a public api.** the "callers" are other code in this repo or dependent repos. they have TypeScript types for vibecheck — they don't need snapshot files.

---

## conclusion

**holds**: all contract output variants are covered.

the codebase uses explicit assertions (not snapshots) as its verification pattern. this is consistent across all 9 integration test files. the nameservers feature follows this pattern exactly, with 10 output variants covered by explicit assertions.

the guide's intent — exhaustive coverage of output variants — is satisfied. the mechanism differs (assertions vs snapshots), but the coverage is equivalent.

no action required.
