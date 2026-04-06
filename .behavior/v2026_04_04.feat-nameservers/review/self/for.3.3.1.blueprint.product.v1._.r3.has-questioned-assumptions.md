# self-review: has-questioned-assumptions (r3)

## what I reviewed

I examined the blueprint for hidden technical assumptions, questioned each one, and verified whether they are supported by evidence or based on habit.

---

## the question I asked

> "what technical assumptions does the blueprint make without explicit evidence?"

---

## assumptions found and questioned

### assumption 1: nameserver page URL follows same pattern as other domain pages

**the assumption**: the blueprint assumes `/dns/domain-nameservers` follows the same URL pattern as other domain pages like `/dns` for DNS records.

**what if opposite were true?**: the URL could be different, like `/settings/nameservers` or a modal within the DNS page.

**evidence check**: external research `3.1.1.research.external.product.access._.v1.i1.md` confirms the URL pattern from squarespace documentation. this is not a habit-based assumption.

**verdict**: VALID — assumption is evidence-based.

---

### assumption 2: scraper can reuse extant navigation and auth patterns

**the assumption**: the blueprint assumes `getNewLoggedInBrowserPage`, `navigateAndAssertUrl`, `waitForSquarespaceReactRender`, and `handleReauthentication` will work for nameserver pages.

**what if opposite were true?**: nameserver pages could require different auth flow, have different React render patterns, or use different URL assertion logic.

**evidence check**: internal research `3.1.3.research.internal.product.code.prod._.v1.i1.md` shows these utilities work across all domain detail pages. the nameserver page is another domain detail page.

**could simpler approach work?**: no — these utilities exist precisely to handle squarespace's SPA behavior consistently.

**verdict**: VALID — assumption is pattern-based and verified across extant code.

---

### assumption 3: minimum 2 nameservers per RFC 1035

**the assumption**: the blueprint requires minimum 2 nameservers based on RFC 1035.

**what if opposite were true?**: squarespace could enforce different limits (e.g., minimum 1, or minimum 4).

**evidence check**: external research `3.1.1.research.external.product.access._.v1.i1.md` confirms squarespace's UI enforces "min 2" from their own validation. RFC 1035 is secondary evidence.

**verdict**: VALID — assumption matches squarespace's actual enforcement.

---

### assumption 4: maximum 13 nameservers per RFC 1035

**the assumption**: the blueprint enforces maximum 13 nameservers based on RFC 1035 limit for NS records.

**what if opposite were true?**: squarespace could allow fewer or more.

**evidence check**: research shows RFC 1035 limit. squarespace may not explicitly enforce this, but values that exceed it would be non-functional DNS.

**counterexample**: some providers allow more than 13 in their UI but only first 13 work.

**verdict**: VALID with caveat — we validate to RFC 1035 for correctness, even if squarespace doesn't enforce it.

---

### assumption 5: empty array treated as null (squarespace default)

**the assumption**: the blueprint treats `[]` same as `null` — both mean "use squarespace default nameservers."

**what if opposite were true?**: `[]` could mean "no nameservers" which is invalid, or could be a distinct state.

**evidence check**: vision document explicitly states this semantic: "empty array `[]` treated as `null` (squarespace default)."

**could simpler approach work?**: we could reject empty array with error. but this treatment is more ergonomic for callers.

**verdict**: VALID — explicit design decision in vision.

---

### assumption 6: confirmation dialogs exist for nameserver changes

**the assumption**: the blueprint codepath tree includes "handle confirmation dialogs" for `setNameserversScraper`.

**what if opposite were true?**: squarespace might not show confirmation, or might show different dialogs (alert, reauthentication).

**evidence check**: external research mentions confirmation dialogs as KHUE (known hazard, unknown extent). premortem research recommends integration tests to handle this.

**verdict**: VALID with uncertainty — assumption is flagged as KHUE, will be discovered in implementation.

---

### assumption 7: FQDN validation regex is sufficient

**the assumption**: the blueprint uses `/^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})*\.?$/i` for FQDN validation.

**what if opposite were true?**: pattern could be too strict (reject valid NS) or too loose (accept invalid NS).

**evidence check**: research traceability review r1 analyzed this pattern. punycode domains (`xn--...`) use only alphanumeric + hyphen, so pattern covers them. underscores are invalid per RFC 1035.

**counterexample**: some internal nameservers use underscore (`_dmarc.example.com`). but these are not NS records.

**verdict**: VALID — pattern is correct per RFC 1035 for nameserver hostnames.

---

### assumption 8: no API exists for nameservers

**the assumption**: the blueprint uses browser automation because no squarespace domains API exists.

**what if opposite were true?**: squarespace could have a hidden or undocumented API.

**evidence check**: external research extensively searched for API documentation. the result was FACT: "no domains API exists." this drives the entire approach.

**could simpler approach work?**: if API existed, we'd use it. browser automation is necessary fallback.

**verdict**: VALID — this is a verified fact, not assumption.

---

## why the blueprint assumptions are valid

### all assumptions trace to evidence

| assumption | evidence source |
|------------|-----------------|
| URL pattern | external research |
| reusable utilities | internal code research |
| min 2 NS | squarespace UI + RFC 1035 |
| max 13 NS | RFC 1035 |
| empty array = null | vision design decision |
| confirmation dialogs | KHUE — flagged for discovery |
| FQDN regex | RFC 1035 + research traceability review |
| no API | external research FACT |

### uncertain assumptions are explicitly flagged

- confirmation dialogs: marked as KHUE in research, will be discovered in integration tests
- max 13 NS: we enforce RFC even if squarespace doesn't

---

## what I learned

### lesson 1: distinguish facts from assumptions

"no API exists" is a FACT from research, not an assumption. "confirmation dialogs exist" is a KHUE — known hazard, unknown extent. the blueprint correctly treats these differently.

### lesson 2: validation rules need dual evidence

min 2 NS has both squarespace evidence (UI enforces it) and standard evidence (RFC 1035). this dual source strengthens the assumption.

### lesson 3: pattern-based assumptions need verification

"reuse extant utilities" is pattern-based. the research verified these utilities work across all domain detail pages, so the assumption is valid.

---

## conclusion

questioned-assumptions review passes:
- 8 technical assumptions identified
- all 8 trace to evidence (research, RFC, or vision design decisions)
- uncertain items (confirmation dialogs) are explicitly flagged as KHUE
- no hidden assumptions based on habit alone
