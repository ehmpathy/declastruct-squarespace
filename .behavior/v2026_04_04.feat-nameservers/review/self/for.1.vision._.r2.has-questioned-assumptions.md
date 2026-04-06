# self-review: has-questioned-assumptions

## assumptions identified and questioned

### 1. squarespace allows custom nameservers via the UI

**what we assume:** the `/dns/domain-nameservers` page allows setting custom nameservers.

**what evidence supports it?** the wish provides a URL that suggests this page exists.

**what if false?** the entire feature wouldn't work. the page might be view-only or not exist.

**verdict: NEED TO VERIFY** — must scrape the page during research phase to confirm UI exists and is functional.

**why it holds (for now):** the wisher provided a specific URL, implying they've seen this page and know it's functional.

---

### 2. null represents squarespace default nameservers

**what we assume:** when `nameservers` is null, the domain uses squarespace's default nameservers.

**what evidence supports it?** none — i invented this convention.

**what if false?** squarespace might always show actual NS records, even for "default" mode. there might be a toggle instead of a nameserver list.

**verdict: NEED TO VERIFY** — must research what the UI actually shows. might need a different representation.

**why it holds (for now):** common pattern in DNS management — "use our nameservers" vs "use custom nameservers" is a typical toggle. null/non-null maps cleanly to this.

---

### 3. nameservers can be read from the page

**what we assume:** the current nameservers are displayed on the page and can be scraped.

**what evidence supports it?** common pattern for domain registrars.

**what if false?** might only be settable, not readable. would break `getNameservers` operation.

**verdict: NEED TO VERIFY** — research phase will confirm.

**why it holds (for now):** DNS management UIs universally show current nameserver state. squarespace likely follows this pattern.

---

### 4. minimum 2 nameservers required for custom

**what we assume:** squarespace requires at least 2 nameservers for custom NS configuration.

**what evidence supports it?** DNS best practice (redundancy). most registrars require 2+.

**what if false?** squarespace might accept 1, or require 4+, or have no limit.

**verdict: NEED TO VERIFY** — check what the form accepts during research.

**why it holds (for now):** 2 is the industry standard minimum. unlikely squarespace differs significantly.

---

### 5. locked domain cannot change nameservers

**what we assume:** domain lock prevents nameserver changes.

**what evidence supports it?** domain lock typically prevents all DNS modifications to avoid hijacking.

**what if false?** nameserver changes might be allowed even when locked. or there might be a separate "nameserver lock".

**verdict: NEED TO VERIFY** — test with a locked domain during research.

**why it holds (for now):** squarespace's domain lock is specifically for transfer protection. nameserver changes could theoretically be separate, but conservative assumption is safer.

---

### 6. no reauthentication needed for nameserver changes

**what we assume:** standard session authentication is sufficient.

**what evidence supports it?** other domain settings (lock, DNSSEC, renewal) don't require reauthentication.

**what if false?** nameserver changes are high-risk (can redirect all traffic). might require password or 2FA.

**verdict: NEED TO VERIFY** — observe during testing if reauthentication modal appears.

**why it holds (for now):** extant domain operations (toggleDomainLock, toggleDnssec) don't require reauthentication. nameserver changes are comparable risk level.

---

### 7. swap back to squarespace is always possible

**what we assume:** after setting custom nameservers, you can always revert to squarespace defaults.

**what evidence supports it?** the wish says "gotta support swap to and swap back".

**what if false?** squarespace might require manual intervention to restore defaults, or might not support reversion at all.

**verdict: NEED TO VERIFY** — must test bidirectional flow.

**why it holds (for now):** wisher explicitly expects this. would be a strange UX if squarespace didn't allow reverting.

---

## summary

| assumption | evidence | verdict |
|------------|----------|---------|
| UI allows custom NS | URL from wish | verify via research |
| null = squarespace default | none (invented) | verify via research |
| nameservers readable | common pattern | verify via research |
| min 2 nameservers | DNS best practice | verify via research |
| locked blocks NS change | common pattern | verify via research |
| no reauthentication | extant ops pattern | verify via research |
| swap back possible | wisher said so | verify via testing |

---

## action: what must be researched

all assumptions need verification during the research phase:
1. scrape `/dns/domain-nameservers` page to understand UI structure
2. identify if there's a "use squarespace" vs "use custom" toggle or just a nameserver list
3. determine what the current NS display looks like
4. test form validation (min/max nameservers, format)
5. test with locked vs unlocked domain
6. observe if reauthentication appears
7. test swap-to and swap-back flows

---

## reflection: why these are unknowns, not issues

each assumption falls into one of two categories:

### category A: research will reveal truth
assumptions 1, 3, 4, 5, 6 — these depend on squarespace's actual UI behavior. we cannot know the answer without observation of the page. no amount of analysis will clarify them. research is the only path.

**why this is appropriate:** the vision explicitly calls out "external research needed" for these. no design change would help — we need data.

### category B: design decisions that may need revision
assumption 2 (null = squarespace default) and 7 (swap back possible) — these are design choices that research may invalidate.

**why this is appropriate:** the design makes reasonable assumptions based on common patterns. if research shows otherwise, we adjust. documented assumptions mean we're prepared to pivot.

---

## the deeper question: am i deferral of issues as "unknowns"?

let me ask: is there something in the vision that i KNOW is wrong but label as "needs research"?

**honest answer: no.**

- i don't KNOW the UI allows custom nameservers — but the wisher's URL suggests it does
- i don't KNOW null is the right representation — but it's a reasonable default, easily changed
- i don't KNOW 2 nameservers is the minimum — but it's the industry standard

these are genuinely unknowns that require observation. the vision handles this correctly with its "external research needed" and "assumptions" sections.

---

## outcome

**no issues to fix now.** the vision correctly identifies its assumptions and marks them for verification. the research phase will validate or invalidate them, and the design will adapt accordingly.

the assumptions are documented, the risks are acknowledged, the path forward is clear: research first, then validate or revise.