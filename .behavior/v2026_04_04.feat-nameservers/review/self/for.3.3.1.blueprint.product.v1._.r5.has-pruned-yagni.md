# self-review: has-pruned-yagni (r5)

## what I reviewed

I stepped back from the author mindset and asked: "what would a critic say is YAGNI here?"

---

## the question I asked

> "if I had to cut 30% of this blueprint, what would I cut?"

---

## yagni suspects examined

### suspect 1: separate validateNameserversInput transformer

**the audit**:
- vision requests validation via edgecases (min 2, invalid FQDN)
- blueprint creates a separate file: `validateNameserversInput.ts`
- alternative: inline validation in setNameservers

**why I thought it might be YAGNI**:
- could inline validation in setNameservers
- fewer files = simpler
- "separate transformer for validation" could be over-engineered

**why it's NOT YAGNI**:
1. test coverage criteria requires unit test for validation
2. unit test needs isolated function
3. inline validation would need integration test (slower, flakier)
4. separation follows single-responsibility principle

**verdict**: NOT YAGNI — required for testability.

---

### suspect 2: separate castIntoDeclaredSquarespaceDomainNameservers transformer

**the audit**:
- vision does NOT name this function
- blueprint creates separate file
- alternative: inline cast in getNameservers

**why I thought it might be YAGNI**:
- could inline the cast logic
- getNameservers is the only caller
- separate file adds navigation overhead

**why it's NOT YAGNI**:
1. declastruct pattern: all features have cast functions (consistency)
2. cast logic often needs to handle edge cases (null, absent fields)
3. unit test for cast is simpler than integration test for getNameservers
4. if scraper output format changes, cast absorbs the change

**the deeper question**: is declastruct pattern itself YAGNI?

**answer**: no — declastruct was chosen in the vision. the pattern comes with the territory.

**verdict**: NOT YAGNI — implied by chosen pattern.

---

### suspect 3: findsert mode in setNameservers

**the audit**:
- vision explicitly requests findsert
- but upsert already covers "set" semantics
- findsert returns extant unchanged

**why I thought it might be YAGNI**:
- callers could just use upsert
- "if no change needed, upsert is idempotent anyway"
- findsert adds code paths

**why it's NOT YAGNI**:
1. findsert has different semantics: "create if absent, else return extant"
2. upsert always overwrites: "create or update"
3. for batch operations, findsert is more efficient (no re-scrape needed)
4. vision explicitly requests both modes

**the deeper question**: could we defer findsert to a future iteration?

**answer**: no — vision requests it. deferral would be a vision violation.

**verdict**: NOT YAGNI — explicitly requested.

---

### suspect 4: max 13 nameservers validation

**the audit**:
- blueprint validates max 13 per RFC 1035
- squarespace UI might not enforce this
- vision edgecases don't explicitly mention max

**why I thought it might be YAGNI**:
- vision edgecases mention min 2, invalid FQDN — not max
- RFC 1035 limit is theoretical
- we could let squarespace enforce limits

**why it's NOT YAGNI**:
1. our job is fail-fast, not pass-through-and-fail-later
2. RFC 1035 is authoritative for DNS
3. values above 13 are non-functional DNS regardless of UI acceptance
4. validation is cheap; debug of non-functional DNS is expensive

**the deeper question**: should we only validate what vision explicitly lists?

**answer**: no — we validate what makes the feature work correctly. max 13 is correctness, not feature creep.

**verdict**: NOT YAGNI — correctness requirement.

---

### suspect 5: multiple selector entries in domainDetailSelectors

**the audit**:
- blueprint adds: nameserverSection, customNameserverInputs, saveNameserversButton, useSquarespaceNameserversButton
- 4 selectors for 1 feature

**why I thought it might be YAGNI**:
- could use fewer selectors
- some might not be needed
- "while we're here, add all possible selectors"

**why it's NOT YAGNI**:
1. scraper needs to find elements
2. each selector corresponds to a UI interaction
3. set.upsert: customNameserverInputs + saveNameserversButton
4. set.upsert(null): useSquarespaceNameserversButton
5. get: nameserverSection

**the deeper question**: are all 4 selectors needed?

**answer**: yes — each maps to a distinct user action or scrape target.

**verdict**: NOT YAGNI — minimum viable selectors.

---

## what I actually found

### found issue: unit tests for orchestrators

**the issue**: blueprint lists `getNameservers.test.ts` and `setNameservers.test.ts` as unit tests for "logic paths."

**why it's suspicious**: orchestrators compose other functions. unit tests for orchestrators often mock all dependencies, which tests the test, not the code.

**investigation**: the blueprint says "unit: logic paths" — this suggests tests for branch logic (if/else), not integration behavior.

**verdict**: ACCEPTABLE — if logic paths exist (e.g., findsert vs upsert branch), unit test is valid. but these tests should be minimal.

**lesson**: unit tests for orchestrators should test branch logic, not mock-heavy integration simulations.

---

## why the blueprint has no yagni

### the 30% cut test

if I had to cut 30%, what would I cut?

| candidate | cut? | reason |
|-----------|------|--------|
| validateNameserversInput | no | required for testability |
| castIntoDeclaredSquarespaceDomainNameservers | no | implied by pattern |
| findsert mode | no | explicitly requested |
| max 13 validation | no | correctness |
| selectors | no | minimum viable |

**result**: I cannot cut 30% without a vision violation or correctness issue.

### the "while we're here" test

did we add features while we're here?

- extra validation rules? no — only min 2, max 13, FQDN format
- extra operations? no — only get and set
- extra error handle? no — fail-fast only
- extra log? no — none specified

**result**: no "while we're here" additions found.

---

## what I learned

### lesson 1: testability requires separation

I initially thought separate transformers might be YAGNI. but unit test requirements justify separation. the alternative (inline + integration test only) is worse.

### lesson 2: pattern consistency is not YAGNI

cast function exists because declastruct pattern exists. the pattern was chosen in vision. pattern-implied components are not extras.

### lesson 3: correctness rules are not YAGNI

max 13 validation is not in vision edgecases, but it's a correctness requirement. feature creep adds features; correctness adds guards.

---

## conclusion

yagni review passes:
- 5 suspects examined in depth
- 0 confirmed YAGNI
- 1 acceptable edge case (orchestrator unit tests)
- 30% cut test: cannot cut without a vision violation
- "while we're here" test: no additions found
