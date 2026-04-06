# self-review: has-questioned-questions

## questions from vision triaged

### from "questions to validate with wisher"

**Q1: do we need to track propagation status, or is "change submitted" sufficient?**

- can this be answered via logic? **yes** — DNS propagation is outside squarespace's control. a propagation tracker adds complexity with limited value. "change submitted" is sufficient for our scope.
- **[answered]** — "change submitted" is sufficient. DNS propagation monitor is out of scope. if needed, external DNS lookup tools can verify.

**Q2: should we validate nameserver hostnames (e.g., must be valid FQDN)?**

- can this be answered via logic? **partially** — basic format validation (FQDN syntax) is reasonable. but validation that they actually work (reachable, configured as NS) is expensive and unreliable.
- **[answered]** — validate FQDN format only. do not validate that they actually work as nameservers.

---

### from "external research needed"

**Q3: scrape the `/dns/domain-nameservers` page to understand UI structure and selectors**

- can this be answered now? **no** — requires observation of the actual page.
- **[research]** — research phase will scrape and document UI structure.

**Q4: verify what confirmation dialogs appear when nameservers change**

- can this be answered now? **no** — requires test of the actual flow.
- **[research]** — research phase will test and document confirmations.

**Q5: understand what error states exist (e.g., invalid nameserver, locked domain)**

- can this be answered now? **no** — requires test of various scenarios.
- **[research]** — research phase will enumerate error states.

---

### from "assumptions"

**Q6: squarespace's nameserver settings page follows similar patterns to other detail pages**

- can this be answered now? **no** — requires observation.
- **[research]** — research phase will validate UI patterns.

**Q7: nameserver changes don't require additional reauthentication**

- can this be answered now? **no** — requires test.
- **[research]** — research phase will test auth flow.

**Q8: squarespace allows swap back to default nameservers after custom**

- can this be answered now? **no** — requires test of bidirectional flow.
- **[research]** — research phase will validate swap-back capability.

---

## summary

| question | triage | action |
|----------|--------|--------|
| propagation track | [answered] | out of scope, "submitted" is sufficient |
| NS hostname validation | [answered] | FQDN format only, not functionality |
| UI structure | [research] | scrape page in research phase |
| confirmation dialogs | [research] | test flow in research phase |
| error states | [research] | enumerate in research phase |
| UI patterns | [research] | validate in research phase |
| reauthentication | [research] | test in research phase |
| swap-back possible | [research] | test in research phase |

---

## issues found and fixed

### issue 1: unanswered questions that can be answered now

**what was wrong:** the vision had two questions marked for "wisher validation" that could actually be answered via logic:
1. propagation status — logic shows this is out of scope
2. nameserver validation — logic shows FQDN format is sufficient

**how i fixed it:** answered both questions and updated the vision to move them from "questions to validate with wisher" to "answered questions".

**the change made:**
```diff
- ### questions to validate with wisher
- 1. do we need to track propagation status, or is "change submitted" sufficient?
- 2. should we validate nameserver hostnames (e.g., must be valid FQDN)?

+ ### answered questions
+ 1. **propagation status**: out of scope. "change submitted" is sufficient.
+ 2. **nameserver validation**: validate FQDN format only. do not validate functionality.
```

---

## non-issues: why remaining questions are correctly triaged

### research questions are correctly deferred

all 6 research questions require observation of the actual squarespace UI:
- UI structure — cannot be inferred, must be observed
- confirmation dialogs — cannot be inferred, must be tested
- error states — cannot be enumerated without test
- UI patterns — cannot be validated without observation
- reauthentication — cannot be known without test
- swap-back — cannot be validated without test

**why these hold:** these questions have no logical path to answer. observation is the only way. they are correctly marked for research phase in "external research needed".

### no wisher questions remain

after triage, no questions require wisher input. this is correct — the wish is clear about what's wanted (nameserver control with swap-to and swap-back). the remaining questions are implementation details that research will clarify.

---

## summary

| category | count | status |
|----------|-------|--------|
| answered now | 2 | vision updated |
| for research | 6 | correctly deferred |
| for wisher | 0 | none needed |