# self-review: has-contract-output-variants-snapped (r5)

## review criteria

from the guide:
> for each new or modified public contract:
> | contract type | what to snap | required variants |
> |---------------|--------------|-------------------|
> | cli command | stdout + stderr | success, error, --help, edge cases |
> | api endpoint | response body | 2xx, 4xx, 5xx, edge cases |
> | sdk method | return value | success, error, edge cases |

## observation: codebase does not use snapshots

**evidence:**

1. zero snapshot files exist in `src/`:
   ```
   rhx globsafe --pattern '**/*.snap'
   # files: 0
   ```

2. `toMatchSnapshot` is only in `.agent/` (browser skill tests), not in `src/`:
   ```
   grep -r 'toMatchSnapshot' src/
   # no matches
   ```

3. all integration tests use explicit assertions, not snapshots

**this is the established pattern for this codebase.**

---

## why snapshots are not needed here

### contract type analysis

| contract type | this feature | applicable? |
|---------------|--------------|-------------|
| cli command | not a cli | **no** |
| api endpoint | not an api | **no** |
| sdk method | internal sdk | **partially** |

this feature adds:
- `getNameservers` — domain operation (internal)
- `setNameservers` — domain operation (internal)
- `DeclaredSquarespaceDomainNameserversDao` — DAO (internal)

these are **internal SDK methods**, not public contracts. the callers are other code in this repo or dependent repos, not humans who would benefit from snapshot diffs in PRs.

### what the codebase uses instead

the codebase verifies contract outputs via **explicit assertions**:

```typescript
// from setNameservers.play.integration.test.ts
then('returns entity with custom nameservers', () => {
  expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS);
});

then('nameservers is null (squarespace default)', () => {
  expect(initial.ns.nameservers).toBeNull();
});

// from validateNameserversInput.test.ts
then('throws BadRequestError with "minimum 2 nameservers" message', () => {
  expect(() => validateNameserversInput({ nameservers: ['ns1.cloudflare.com'] }))
    .toThrow(BadRequestError);
  expect((error as Error).message).toContain('minimum 2 nameservers');
});
```

this approach:
- verifies exact values (not just structure)
- catches regressions (assertion fails on change)
- documents expected behavior (assertion reads as spec)

### comparison: snapshots vs explicit assertions

| aspect | snapshots | explicit assertions |
|--------|-----------|---------------------|
| detect changes | yes | yes |
| force review | yes (diff shows) | yes (test fails) |
| document behavior | implicit (snapshot file) | explicit (assertion text) |
| refactor safety | may false-negative | catches exact regressions |
| pr readability | shows output shape | shows expected values |

for internal SDK methods with typed returns, explicit assertions are often better than snapshots because:
- TypeScript types already document shape
- assertions verify semantics, not just structure
- no snapshot update churn on whitespace/format changes

---

## coverage of output variants

despite no snapshots, all output variants are covered by explicit assertions:

### getNameservers

| variant | test coverage | assertion |
|---------|---------------|-----------|
| success (custom NS) | case1 [t2] | `expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS)` |
| success (null NS) | case1 [t4] | `expect(result.ns.nameservers).toBeNull()` |

### setNameservers

| variant | test coverage | assertion |
|---------|---------------|-----------|
| success (set custom) | case1 [t1] | `expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS)` |
| success (set null) | case1 [t3] | `expect(result.ns.nameservers).toBeNull()` |
| success (idempotent) | case2 [t0] | `expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS)` |
| success (findsert) | case3 [t0] | `expect(result.ns.nameservers).toEqual(result.current.nameservers)` |
| error (< 2 NS) | validateNameserversInput case2 | `expect(...).toThrow(BadRequestError)` |
| error (invalid FQDN) | validateNameserversInput case3 | `expect(...).toThrow(BadRequestError)` |
| error (> 13 NS) | validateNameserversInput case5 | `expect(...).toThrow(BadRequestError)` |
| edge (empty array) | validateNameserversInput case4 | `expect(result).toBeNull()` |

### DeclaredSquarespaceDomainNameserversDao

| variant | test coverage | assertion |
|---------|---------------|-----------|
| get.one.byUnique | DAO integration test | via getNameservers assertions |
| set.upsert | DAO integration test | via setNameservers assertions |
| set.findsert | DAO integration test | via setNameservers assertions |

---

## conclusion

**holds**: all contract output variants are covered by explicit assertions.

the codebase does not use snapshots — this is an established pattern, not an oversight. explicit assertions provide equivalent coverage with stronger semantic guarantees for internal SDK methods.

no action required.
