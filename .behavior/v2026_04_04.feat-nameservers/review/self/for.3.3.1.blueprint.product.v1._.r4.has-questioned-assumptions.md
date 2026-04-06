# self-review: has-questioned-assumptions (r4)

## what I reviewed

I re-examined the blueprint with fresh eyes, specifically to find assumptions a junior developer might make based on habit rather than evidence. I challenged each assumption with "what if the opposite were true?"

---

## the question I asked

> "what hidden assumptions does the blueprint make that could break in production?"

---

## assumptions found and questioned

### assumption 1: nameserver page exists at predictable URL

**the assumption**: URL is `/dns/domain-nameservers` based on extant pattern.

**what if opposite were true?**:
- squarespace could change URLs without notice
- nameserver settings could be embedded in a modal, not a separate page
- URL could vary by account type or plan

**why it holds**: external research confirms this URL from official squarespace documentation. however, the scraper must use `navigateAndAssertUrl` to fail fast if URL changes.

**lesson**: always assert URL after navigation. never assume URL pattern persists.

---

### assumption 2: squarespace UI uses same React patterns as other pages

**the assumption**: `waitForSquarespaceReactRender` will work for nameserver page.

**what if opposite were true?**:
- nameserver page could be a different frontend framework
- React hydration time could differ
- page could use lazy load patterns that break wait logic

**why it holds**: internal research shows consistent React patterns across all domain detail pages. but integration tests are the real verification.

**the deeper question**: what if squarespace updates their frontend framework?

**mitigation in blueprint**: integration tests will catch any drift. the test tree includes `scrapeNameservers.integration.test.ts` which verifies the scraper works against live UI.

---

### assumption 3: min 2 nameservers is enforced by squarespace

**the assumption**: validation enforces min 2 based on research.

**what if opposite were true?**:
- squarespace could allow 1 NS in certain cases
- squarespace could have different limits for different domain types

**why it holds**: RFC 1035 requires min 2 for redundancy. squarespace's UI enforces this per research. even if squarespace allowed 1, DNS wouldn't work reliably.

**the deeper question**: should we be more lenient than squarespace?

**answer**: no — our job is to fail fast with clear errors, not to pass through and let squarespace reject.

---

### assumption 4: confirmation dialogs can be handled generically

**the assumption**: `handleReauthentication` and "handle confirmation dialogs" are sufficient.

**what if opposite were true?**:
- nameserver change could require additional verification (email, 2FA, wait period)
- confirmation could be a multi-step flow
- squarespace could require explicit acknowledgment of DNS propagation delay

**this is a real gap**: the blueprint marks this as KHUE (known hazard, unknown extent). the assumption IS that we can handle it, but the extent is unknown.

**why it's acceptable**: the blueprint includes integration tests that will discover the actual dialog flow. the codepath tree explicitly includes "handle confirmation dialogs" which acknowledges uncertainty.

**lesson**: when we don't know, we mark it and plan to discover. the blueprint does this correctly.

---

### assumption 5: nameserver values don't need further validation beyond FQDN

**the assumption**: we validate FQDN format but not nameserver reachability.

**what if opposite were true?**:
- user could enter syntactically valid but non-functional NS
- user could enter NS that exist but aren't configured for their domain

**why it holds**: vision explicitly marks reachability validation as out of scope. quote: "do not validate that nameservers actually work (reachable, configured) — too expensive and unreliable."

**the deeper question**: are we to push the problem to the user?

**answer**: yes, deliberately. DNS verification tools exist. we're not a DNS health checker.

---

### assumption 6: null semantics are universal

**the assumption**: `nameservers: null` always means "squarespace default" regardless of domain state.

**what if opposite were true?**:
- some domains might not support squarespace default (transferred in?)
- some domains might have squarespace NS but with custom values

**why it holds**: vision document specifies this semantic. the scraper will detect actual state and return it. if domain can't use squarespace default, setNameserversScraper will fail and we'll discover it.

**lesson**: the null semantic is our contract. if squarespace can't fulfill it, we fail fast.

---

### assumption 7: session persistence is sufficient for nameserver changes

**the assumption**: a single `getNewLoggedInBrowserPage` session can complete the entire operation.

**what if opposite were true?**:
- nameserver changes could trigger reauthentication mid-flow
- session could expire while we wait for DNS propagation
- squarespace could force re-login for sensitive operations

**why it holds**: internal research shows `handleReauthentication` handles mid-flow reauth. the blueprint explicitly reuses this pattern.

**the deeper question**: what if reauthentication fails?

**mitigation**: `handleReauthentication` throws on failure. operation fails fast with clear error.

---

### assumption 8: error states are discoverable via UI scrape

**the assumption**: when squarespace rejects a change, we can detect and report it.

**what if opposite were true?**:
- error could appear in toast notification that disappears
- error could be logged server-side only
- error could manifest as silent no-op

**this is a real gap**: research flagged error state discovery as KHUE.

**mitigation in blueprint**: `setNameserversScraper` includes "verify nameserver change" step. we scrape AFTER mutation to confirm the change applied. silent no-op would be detected.

**lesson**: always verify state after mutation. never assume mutation succeeded.

---

## why the blueprint assumptions are valid

### critical pattern: verify after mutate

the blueprint includes verification steps:
- `scrapeNameservers` after `setNameserversScraper`
- `navigateAndAssertUrl` after navigation
- `waitForSquarespaceReactRender` after page load

this pattern catches assumption failures at runtime.

### critical pattern: fail fast on unknown

the blueprint uses fail-fast for uncertain areas:
- KHUE items will fail in integration tests
- invalid states throw errors, not return nulls
- assertions exist at every boundary

### what I would do differently

if I were to write this blueprint from scratch:
1. I would explicitly list "unknown until tested" items (DONE — KHUEs are listed)
2. I would add timeout for confirmation dialogs (NOT DONE — could add)
3. I would consider retry logic for transient failures (NOT DONE — but fail-fast is acceptable)

these are enhancements, not blockers.

---

## what I learned

### lesson 1: KHUEs are honest uncertainty

the blueprint correctly marks "confirmation dialogs" and "error states" as KHUE. this is better than to pretend we know.

### lesson 2: verify-after-mutate catches bad assumptions

the blueprint's verification pattern means assumption failures are caught, not silently ignored.

### lesson 3: external dependencies are assumption hotspots

every assumption about squarespace's behavior (URLs, UI patterns, validation rules) could break. integration tests are the verification layer.

---

## conclusion

questioned-assumptions review passes:
- 8 assumptions examined in depth
- 2 are explicit KHUEs with mitigation (confirmation dialogs, error states)
- 6 are evidence-based with verification patterns
- blueprint's verify-after-mutate pattern catches assumption failures
- no hidden assumptions based on habit without mitigation
