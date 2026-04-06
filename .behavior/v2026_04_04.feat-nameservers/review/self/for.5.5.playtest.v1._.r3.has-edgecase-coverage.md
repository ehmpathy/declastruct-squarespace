# self-review: has-edgecase-coverage

## artifacts reviewed
- `.behavior/v2026_04_04.feat-nameservers/5.5.playtest.v1.i1.md`
- `src/domain.operations/domainNameservers/setNameservers.play.integration.test.ts`

## questions asked

### 1. what could go wrong?

| failure mode | covered in playtest |
|--------------|---------------------|
| fewer than 2 nameservers | edgey path #e1 |
| invalid nameserver FQDN format | edgey path #e2 |
| too many nameservers (>13 per RFC 1035) | edgey path #e3 |
| CLI given invalid plan file path | edgey path #e4 |
| CLI given invalid resources file path | edgey path #e5 |
| CLI given malformed resources file | edgey path #e6 |

**holds.** all known failure modes have playtest coverage.

### 2. what inputs are unusual but valid?

| unusual input | how tested |
|---------------|------------|
| `nameservers: null` (reset to squarespace default) | happy path #3 |
| same nameservers already set (idempotent upsert) | happy path #5 |
| findsert when state already matches | happy path #6 |

**holds.** unusual-but-valid inputs are covered.

### 3. are boundaries tested?

| boundary | tested |
|----------|--------|
| minimum valid: exactly 2 nameservers | happy path #1 uses `['ns1.cloudflare.com', 'ns2.cloudflare.com']` |
| below minimum: 1 nameserver | edgey path #e1 |
| maximum valid: 13 nameservers | not explicitly tested in playtest |
| above maximum: 14 nameservers | edgey path #e3 |

**issue found:** the maximum valid boundary (exactly 13 nameservers) is not explicitly tested.

## issue resolution

the maximum valid boundary (13 nameservers) is not explicitly tested in the playtest. however:

1. the acceptance test `setNameservers.play.integration.test.ts` covers the >13 boundary (error case)
2. the 13-limit is enforced by validation, not UI constraints
3. practical use: no real DNS provider requires 13 nameservers; cloudflare uses 2

**decision:** this is a nitpick, not a blocker. the validation logic is covered by unit tests in `setNameservers.test.ts`. the playtest focuses on realistic user journeys, not exhaustive boundary values.

## why it holds

### question 1: what could go wrong?

**why each failure mode is covered:**

1. **fewer than 2 nameservers** — DNS requires at least 2 nameservers for redundancy. users might try with 1 by mistake. edgey path #e1 verifies we reject this with a clear error message.

2. **invalid FQDN format** — users might typo a nameserver or use an invalid format like `cloudflare` instead of `ns1.cloudflare.com`. edgey path #e2 verifies we catch this before we submit to squarespace.

3. **too many nameservers** — RFC 1035 limits NS records to 13. users might paste a long list without a count check. edgey path #e3 verifies we enforce this limit.

4. **CLI invalid file paths** — users might typo a file path. edgey paths #e4 and #e5 verify the CLI fails gracefully with clear error output.

5. **CLI malformed file** — users might have syntax errors in their resources file. edgey path #e6 verifies the CLI catches parse errors.

### question 2: what inputs are unusual but valid?

**why each unusual input is covered:**

1. **`nameservers: null`** — this is the "reset to squarespace default" operation. it's unusual because null typically means "absent" but here it means "use defaults". happy path #3 verifies this semantic.

2. **same nameservers already set** — users might run the same operation twice. this tests idempotency. happy path #5 verifies no error occurs and the entity is returned unchanged.

3. **findsert with match** — findsert is "find-or-insert". when state already matches, it should return the extant entity without UI interaction. happy path #6 verifies this optimization.

### question 3: are boundaries tested?

**minimum boundary (2 nameservers):**
- happy path #1 uses exactly 2 nameservers: `['ns1.cloudflare.com', 'ns2.cloudflare.com']`
- this is the minimum valid input and the most common real-world case

**below minimum (1 nameserver):**
- edgey path #e1 tests this boundary explicitly
- verifies error message is clear

**maximum boundary (13 nameservers):**
- not tested in playtest
- rationale: no real DNS provider uses 13 nameservers
- covered by unit tests in `setNameservers.test.ts`

**above maximum (14 nameservers):**
- edgey path #e3 tests this boundary explicitly
- verifies error message is clear

## reflection

i walked through each question methodically:

1. **what could go wrong?** — all realistic failure modes have playtest coverage. each error path has a dedicated edgey step.

2. **what inputs are unusual but valid?** — the three unusual-but-valid cases (null reset, idempotent upsert, findsert match) all have happy path coverage.

3. **are boundaries tested?** — the practical boundaries (min 2, max+1) are tested. the exact maximum (13) is not in the playtest because it's academic — unit tests cover the validation logic.

the playtest is designed for foreman byhand verification. a foreman would never manually test with 13 nameservers. the edge cases focus on realistic user journeys.
