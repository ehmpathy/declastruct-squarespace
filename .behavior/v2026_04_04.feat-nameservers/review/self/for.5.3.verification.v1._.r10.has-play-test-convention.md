# self-review: has-play-test-convention (r10)

## review criteria

from the guide:
> double-check: are journey test files named correctly?
>
> journey tests should use `.play.test.ts` suffix:
> - `feature.play.test.ts` — journey test
> - `feature.play.integration.test.ts` — if repo requires integration runner
> - `feature.play.acceptance.test.ts` — if repo requires acceptance runner

---

## step 1: enumerate journey test files

**command:** `glob **/*.play.*.test.ts`

**result:**

```
src/domain.operations/domainNameservers/setNameservers.play.integration.test.ts
```

**total:** 1 journey test file for this feature

---

## step 2: verify name convention

### setNameservers.play.integration.test.ts

| criterion | expected | actual | status |
|-----------|----------|--------|--------|
| has `.play.` suffix | yes | yes | pass |
| has runner suffix | `.integration.test.ts` | `.integration.test.ts` | pass |
| feature name prefix | `setNameservers` | `setNameservers` | pass |

---

## step 3: verify location

| criterion | expected | actual | status |
|-----------|----------|--------|--------|
| in domain.operations | yes | `src/domain.operations/domainNameservers/` | pass |
| collocated with operation | yes | same folder as `setNameservers.ts` | pass |

---

## step 4: verify this is the only convention needed

the repros artifact (line 195-200) specified:

> journey test files will use `.play.integration.test.ts` suffix per guide fallback:
>
> - `setNameservers.play.integration.test.ts` — nameservers journey test
> - `DeclaredSquarespaceDomainNameserversDao.play.integration.test.ts` — DAO journey test

**actual implementation:**
- `setNameservers.play.integration.test.ts` — exists, correct
- `DeclaredSquarespaceDomainNameserversDao.play.integration.test.ts` — not created (not needed)

**why the DAO journey test is not needed:**
- the DAO delegates directly to `getNameservers` and `setNameservers`
- journey tests on `setNameservers` already cover the full round-trip
- DAO journey tests would be redundant

---

## step 5: verify consistency with codebase

**check for other `.play.` tests in codebase:**

```bash
glob **/*.play.*.test.ts
```

**result:** only one file — `setNameservers.play.integration.test.ts`

this is the first journey test in this codebase. the convention is correct per the guide.

---

## step 6: verify test execution

**evidence from test run (earlier in this session):**

```
Tests:       11 passed, 11 total
Time:        130.418 s
```

the journey test runs successfully with the integration runner, which confirms the file name convention is correct for this repo's test infrastructure.

---

## conclusion

**holds**: journey test file follows the `.play.integration.test.ts` convention.

| aspect | why it holds |
|--------|--------------|
| file name | `setNameservers.play.integration.test.ts` includes `.play.` and `.integration.test.ts` |
| location | collocated in `src/domain.operations/domainNameservers/` with the operation |
| runner | uses `integration` runner as appropriate for tests that touch real squarespace UI |
| completeness | covers all critical paths; DAO journey test is redundant and omitted |
| execution | test runs successfully (11 passed) with integration runner |

no action needed.
