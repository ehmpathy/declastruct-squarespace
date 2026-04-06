# self-review: has-acceptance-test-citations

## artifacts reviewed
- `.behavior/v2026_04_04.feat-nameservers/5.5.playtest.v1.i1.md`
- `src/domain.operations/domainNameservers/setNameservers.play.integration.test.ts`
- `src/contract/sdks/declastruct.acceptance.test.ts`

## citation verification: happy paths

### happy path #1: swap nameservers to cloudflare

```
step: "npm run test:integration -- setNameservers.play.integration.test.ts --testNamePattern='upsert to cloudflare'"
test: src/domain.operations/domainNameservers/setNameservers.play.integration.test.ts
case: given('[case1] domain with squarespace default nameservers') when('[t1] setNameservers upsert to cloudflare')
assertions:
  - then('returns entity with custom nameservers') → expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS)
  - then('full entity matches snapshot (custom case)') → expect(result.ns).toMatchSnapshot()
```

**verified at line 60-82 of setNameservers.play.integration.test.ts**

### happy path #2: verify nameservers via get operation

```
step: "npm run test:integration -- setNameservers.play.integration.test.ts --testNamePattern='getNameservers after change'"
test: src/domain.operations/domainNameservers/setNameservers.play.integration.test.ts
case: given('[case1] domain with squarespace default nameservers') when('[t2] getNameservers after change')
assertions:
  - then('returns entity with custom nameservers') → expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS)
```

**verified at line 84-96 of setNameservers.play.integration.test.ts**

### happy path #3: swap nameservers back to squarespace default

```
step: "npm run test:integration -- setNameservers.play.integration.test.ts --testNamePattern='upsert back to null'"
test: src/domain.operations/domainNameservers/setNameservers.play.integration.test.ts
case: given('[case1] domain with squarespace default nameservers') when('[t3] setNameservers upsert back to null')
assertions:
  - then('returns entity with null nameservers') → expect(result.ns.nameservers).toBeNull()
```

**verified at line 98-115 of setNameservers.play.integration.test.ts**

### happy path #4: verify reset via get operation

```
step: "npm run test:integration -- setNameservers.play.integration.test.ts --testNamePattern='getNameservers after reset'"
test: src/domain.operations/domainNameservers/setNameservers.play.integration.test.ts
case: given('[case1] domain with squarespace default nameservers') when('[t4] getNameservers after reset')
assertions:
  - then('returns entity with null nameservers') → expect(result.ns.nameservers).toBeNull()
```

**verified at line 117-129 of setNameservers.play.integration.test.ts**

### happy path #5: idempotent upsert (same values)

```
step: "npm run test:integration -- setNameservers.play.integration.test.ts --testNamePattern='idempotent upsert'"
test: src/domain.operations/domainNameservers/setNameservers.play.integration.test.ts
case: given('[case2] idempotent upsert (same values)') when('[t0] upsert with same nameservers already set')
assertions:
  - then('returns entity with same nameservers') → expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS)
  - then('setup had same values') → expect(setup.ns.nameservers).toEqual(CLOUDFLARE_NS)
```

**verified at line 132-169 of setNameservers.play.integration.test.ts**

### happy path #6: findsert semantics

```
step: "npm run test:integration -- setNameservers.play.integration.test.ts --testNamePattern='findsert'"
test: src/domain.operations/domainNameservers/setNameservers.play.integration.test.ts
case: given('[case3] findsert semantics') when('[t0] findsert with same state as current')
assertions:
  - then('returns extant entity unchanged') → expect(result.ns.nameservers).toEqual(result.current.nameservers)
  - then('findsert is faster than upsert (no UI interaction)') → expect(result.duration).toBeLessThan(30000)
```

**verified at line 200-234 of setNameservers.play.integration.test.ts**

### happy path #7: declastruct CLI workflow (end-to-end)

```
step: "npm run test:acceptance -- declastruct.acceptance.test.ts"
test: src/contract/sdks/declastruct.acceptance.test.ts
case 1: given('a declastruct resources file') when('plan is generated via declastruct CLI') then('plan includes nameserver resources')
case 2: given('a declastruct resources file') when('plan is verified via declastruct CLI') then('nameserver config shows KEEP after apply')
```

**verified at line 196 and line 396 of declastruct.acceptance.test.ts**

---

## citation verification: edgey paths

### edgey path #e1: fewer than 2 nameservers

```
step: "npm run test:integration -- setNameservers.play.integration.test.ts --testNamePattern='fewer than 2 nameservers'"
test: src/domain.operations/domainNameservers/setNameservers.play.integration.test.ts
case: given('[case4] validation errors') when('[t0] fewer than 2 nameservers')
assertions:
  - then('throws validation error') → expect(result.error).not.toBeNull()
  - then('error matches snapshot') → expect({ errorName, errorMessage }).toMatchSnapshot()
```

**verified at line 237-273 of setNameservers.play.integration.test.ts**

### edgey path #e2: invalid FQDN format

```
step: "npm run test:integration -- setNameservers.play.integration.test.ts --testNamePattern='invalid FQDN format'"
test: src/domain.operations/domainNameservers/setNameservers.play.integration.test.ts
case: given('[case4] validation errors') when('[t1] invalid FQDN format')
assertions:
  - then('throws validation error') → expect(result.error).not.toBeNull()
  - then('error matches snapshot') → expect({ errorName, errorMessage }).toMatchSnapshot()
```

**verified at line 275-311 of setNameservers.play.integration.test.ts**

### edgey path #e3: more than 13 nameservers

```
step: "npm run test:integration -- setNameservers.play.integration.test.ts --testNamePattern='more than 13 nameservers'"
test: src/domain.operations/domainNameservers/setNameservers.play.integration.test.ts
case: given('[case4] validation errors') when('[t2] more than 13 nameservers')
assertions:
  - then('throws validation error') → expect(result.error).not.toBeNull()
  - then('error matches snapshot') → expect({ errorName, errorMessage }).toMatchSnapshot()
```

**verified at line 313-350 of setNameservers.play.integration.test.ts**

### edgey path #e4: CLI error handle - invalid plan file

```
step: "npm run test:acceptance -- declastruct.acceptance.test.ts --testNamePattern='invalid plan file'"
test: src/contract/sdks/declastruct.acceptance.test.ts
case: given('a declastruct resources file') when('apply fails due to invalid plan file')
assertions:
  - then('returns non-zero exit code') → expect(result.exitCode).not.toBe(0)
  - then('error output matches snapshot') → expect(result.stderr).toMatchSnapshot()
```

**verified at line 296 of declastruct.acceptance.test.ts**

### edgey path #e5: CLI error handle - invalid resources file path

```
step: "npm run test:acceptance -- declastruct.acceptance.test.ts --testNamePattern='invalid resources file path'"
test: src/contract/sdks/declastruct.acceptance.test.ts
case: given('a declastruct resources file') when('plan fails due to invalid resources file path')
assertions:
  - then('returns non-zero exit code') → expect(result.exitCode).not.toBe(0)
  - then('error output matches snapshot') → expect(result.stderr).toMatchSnapshot()
```

**verified at line 434 of declastruct.acceptance.test.ts**

### edgey path #e6: CLI error handle - malformed resources file

```
step: "npm run test:acceptance -- declastruct.acceptance.test.ts --testNamePattern='malformed resources file'"
test: src/contract/sdks/declastruct.acceptance.test.ts
case: given('a declastruct resources file') when('plan fails due to malformed resources file')
assertions:
  - then('returns non-zero exit code') → expect(result.exitCode).not.toBe(0)
  - then('error output matches snapshot') → expect(result.stderr).toMatchSnapshot()
```

**verified at line 461 of declastruct.acceptance.test.ts**

---

## verification method

i read each playtest step, then searched the source files for the cited test case:

```bash
# integration test file
grep -n '\[case1\]\|\[case2\]\|\[case3\]\|\[case4\]\|\[t[0-4]\]' \
  src/domain.operations/domainNameservers/setNameservers.play.integration.test.ts

# acceptance test file
grep -n 'plan includes nameserver\|nameserver config shows KEEP\|invalid plan file\|invalid resources file path\|malformed resources file' \
  src/contract/sdks/declastruct.acceptance.test.ts
```

every citation in the playtest document matches an actual test case in the source files. line numbers confirmed.

---

## issues found

none.

---

## why it holds

### zero unproven steps

every playtest step maps to a specific test case with explicit assertions:

1. **happy path #1** — line 60-82 verifies upsert to cloudflare with snapshot
2. **happy path #2** — line 84-96 verifies get returns cloudflare nameservers
3. **happy path #3** — line 98-115 verifies upsert back to null
4. **happy path #4** — line 117-129 verifies get returns null after reset
5. **happy path #5** — line 132-169 verifies idempotent upsert returns same entity
6. **happy path #6** — line 200-234 verifies findsert returns extant unchanged
7. **happy path #7** — line 196 + line 396 verify CLI workflow includes nameservers

8. **edgey path #e1** — line 237-273 verifies < 2 nameservers throws error
9. **edgey path #e2** — line 275-311 verifies invalid FQDN throws error
10. **edgey path #e3** — line 313-350 verifies > 13 nameservers throws error
11. **edgey path #e4** — line 296 verifies invalid plan file returns error
12. **edgey path #e5** — line 434 verifies invalid resources path returns error
13. **edgey path #e6** — line 461 verifies malformed resources returns error

### zero gaps

no playtest step exists without a cited test case. all 13 steps verified.

### bidirectional coverage

the playtest cites tests, and the tests exercise the behaviors described. no orphan steps in the playtest, no untested behaviors in the tests.

---

## reflection

i verified each citation by:
1. read the playtest step command and expected outcome
2. located the exact line in source where the test case is defined
3. confirmed the test assertions match the playtest expected outcome
4. recorded the line number for traceability

all 13 playtest steps have verified acceptance test coverage with exact line numbers.
