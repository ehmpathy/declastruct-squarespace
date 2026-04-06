# self-review: has-play-test-convention

## review of journey test file convention

### repo conventions

this repo uses these test conventions:

| pattern | purpose | example |
|---------|---------|---------|
| `*.test.ts` | unit tests | `DeclaredSquarespaceDomainRegistration.test.ts` |
| `*.integration.test.ts` | integration tests | `setDomain.integration.test.ts` |

no `.play.test.ts` files exist in this repo.

### decision — revised

the guide states: "if the repo doesn't support `.play.test.ts` directly, plan to use `.play.integration.test.ts` or `.play.acceptance.test.ts` instead."

**reconsidered**: my initial choice was to use `*.integration.test.ts` for consistency with extant patterns. but the guide's purpose is to **distinguish** journey tests from other tests. the `.play.` infix serves this purpose.

**final decision**: use `*.play.integration.test.ts` (guide's fallback)

**rationale**:
- the `.play.` infix signals "this is a journey test" — clear semantic
- allows future contributors to identify journey tests at a glance
- follows guide's explicit fallback recommendation
- new convention is minimal overhead for the benefit of clarity

### where journey tests will go

| test | file |
|------|------|
| nameservers journey (swap to cloudflare, swap back) | `setNameservers.play.integration.test.ts` |
| nameservers DAO journey | `DeclaredSquarespaceDomainNameserversDao.play.integration.test.ts` |

these will contain the BDD `given/when/then` structure as sketched in the experience reproductions document.

---

## why this holds

### guide compliance

the guide explicitly states: "if the repo doesn't support `.play.test.ts` directly, plan to use `.play.integration.test.ts` or `.play.acceptance.test.ts` instead."

this repo doesn't support `.play.test.ts`. therefore, we use `.play.integration.test.ts` per guide fallback.

### extant patterns considered

| file | pattern | journey-style? |
|------|---------|---------------|
| `setDomain.integration.test.ts` | `.integration.test.ts` | **yes** — uses `given/when/then`, tests swap/swap-back |
| `toggleDomainLock.integration.test.ts` | `.integration.test.ts` | **yes** — uses `given/when/then`, tests toggle/toggle-back |
| `requestTransferCode.integration.test.ts` | `.integration.test.ts` | **yes** — uses `given/when/then`, tests request flow |

extant journey-style tests use `.integration.test.ts` suffix. however, this is considered and **rejected** in favor of guide's recommended `.play.integration.test.ts` for semantic clarity.

### why `.play.integration.test.ts` over `*.integration.test.ts`?

initially considered `*.integration.test.ts` for consistency with extant patterns. **reconsidered and rejected** because:
- the `.play.` infix serves a semantic purpose: **distinguish journey tests**
- without `.play.`, journey tests are indistinguishable from other integration tests
- guide's intent (distinguish test types) > extant pattern consistency
- minimal cognitive load: new suffix, but clear semantics

**final decision**: introduce `.play.integration.test.ts` convention per guide fallback.

---

## issues found

### issue 1: file convention section was absent from experience reproductions document

**found**: the experience reproductions document (3.2.distill.repros.experience._.v1.i1.md) did not include the "file convention" section that the stone template requested.

**fixed**: added "file convention" section to the document.

**lesson**: always cross-check the stone template against the output document to ensure all sections are present.

### issue 2: initially chose wrong convention

**found**: my initial choice was to use `*.integration.test.ts` for consistency with extant patterns. but this misses the guide's intent: the `.play.` infix serves to **distinguish** journey tests from other tests.

**fixed**: revised decision to use `*.play.integration.test.ts` per guide's fallback. updated both the self-review and the experience reproductions document.

**lesson**: when a convention serves a semantic purpose (here: distinguishing test types), follow the convention even if it introduces a new pattern to the repo. consistency with intent > consistency with extant patterns.

---

## what I learned

### lesson 1: check the template first

I initially omitted the "file convention" section from the experience reproductions document because I didn't read the stone template thoroughly. this is a pattern: rushing leads to incomplete work that must be fixed later.

**takeaway**: before declaring output complete, cross-check against the stone template section by section.

### lesson 2: intent over consistency

my initial instinct was to follow extant patterns (`*.integration.test.ts`) for consistency. but the guide's intent — to distinguish journey tests from other tests — is more valuable than pattern consistency.

**takeaway**: when a convention serves a semantic purpose, follow the convention even if the repo hasn't adopted it yet. semantic clarity > local consistency.

### lesson 3: self-review catches drift

the self-review process forced me to reconsider my initial decision. without this step, I would have committed to `.integration.test.ts` and lost the semantic benefit of `.play.`.

**takeaway**: self-review is not a gate to pass. it's an opportunity to catch my own drift from intent.

---

## conclusion

journey tests will use `*.play.integration.test.ts` suffix per guide fallback:
- `setNameservers.play.integration.test.ts`
- `DeclaredSquarespaceDomainNameserversDao.play.integration.test.ts`

the `.play.` infix distinguishes journey tests from regular integration tests, per guide intent.

**verified**: experience reproductions document (3.2.distill.repros.experience._.v1.i1.md) has been updated with correct file convention section.
