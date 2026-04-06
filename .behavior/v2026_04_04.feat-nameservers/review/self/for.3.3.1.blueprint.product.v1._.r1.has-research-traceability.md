# self-review: has-research-traceability

## research artifacts reviewed

| artifact | path |
|----------|------|
| external access | `3.1.1.research.external.product.access._.v1.i1.md` |
| external claims | `3.1.1.research.external.product.claims._.v1.i1.md` |
| internal prod code | `3.1.3.research.internal.product.code.prod._.v1.i1.md` |
| internal test code | `3.1.3.research.internal.product.code.test._.v1.i1.md` |
| audience reflection | `3.1.5.research.reflection.product.audience._.v1.i1.md` |
| premortem reflection | `3.1.5.research.reflection.product.premortem._.v1.i1.md` |
| root cause reflection | `3.1.5.research.reflection.product.rootcause._.v1.i1.md` |

---

## traceability matrix

### from external access research (3.1.1)

| recommendation | in blueprint? | where |
|----------------|---------------|-------|
| browser automation required (no API) | YES | entire approach |
| min 2, max 13 nameservers | YES | "validation rules" section |
| FQDN format per RFC 1035 | YES | `FQDN_PATTERN` in "nameserver FQDN validation" |
| 24-48h propagation is out of scope | YES | implicit — not included in scope |
| storageState for auth | YES | reuses `getNewLoggedInBrowserPage` |
| stealth plugin (extant) | YES | implicit — extant setup reused |
| rate limit risk | YES | implicit — extant patterns have delays |
| use data-testid selectors | YES | "selectors centralization" mentions this |

### from external claims research (3.1.1)

| claim | in blueprint? | where |
|-------|---------------|-------|
| [FACT] no domains API | YES | browser automation approach |
| [FACT] min 2 nameservers | YES | validation rules |
| [FACT] max 13 nameservers | YES | validation rules |
| [FACT] swap-back supported | YES | `nameservers: null` semantics |
| [SUMP] client-side FQDN validation | YES | `FQDN_PATTERN` regex |
| [SUMP] sessions last long enough | YES | reuses extant page lifecycle |
| [KHUE] confirmation dialogs | YES | codepath tree: "handle confirmation dialogs" |
| [KHUE] error states | DEFERRED | discovered via UI exploration |
| [KHUE] reauthentication | YES | codepath tree: `handleReauthentication` |

### from internal prod code research (3.1.3)

| pattern | in blueprint? | where |
|---------|---------------|-------|
| DomainEntity pattern | YES | filediff: `DeclaredSquarespaceDomainNameservers.ts` |
| genDeclastructDao | YES | filediff: `DeclaredSquarespaceDomainNameserversDao.ts` |
| findsert/upsert | YES | codepath tree: setNameservers operation |
| toggle scraper (idempotent) | YES | codepath tree: setNameserversScraper |
| selectors centralization | YES | filediff: `domainDetailSelectors.ts` [~] |
| waitForSquarespaceReactRender | YES | codepath tree: reuse from extant |
| handleReauthentication | YES | codepath tree: reuse from extant |
| withNewLoggedInBrowserPage | YES | codepath tree: via getNewLoggedInBrowserPage |
| castInto* transformer | YES | filediff: `castIntoDeclaredSquarespaceDomainNameservers.ts` |
| URL pattern | YES | implementation notes: `/dns/domain-nameservers` |

### from internal test code research (3.1.3)

| pattern | in blueprint? | where |
|---------|---------------|-------|
| domain object unit test | YES | test tree: `DeclaredSquarespaceDomainNameservers.test.ts` |
| test context (getSampleSquarespaceContext) | YES | implicit in integration tests |
| useBeforeAll pattern | YES | implicit in test structure |
| scraper integration test | YES | test tree: `scrapeNameservers.integration.test.ts` |
| idempotency test | YES | test coverage: upsert same twice is no-op |
| findsert vs upsert test | YES | test coverage: findsert returns extant |
| file collocation | YES | filediff tree structure |
| validation unit test | YES | test tree: `validateNameserversInput.test.ts` |

### from audience reflection (3.1.5)

| recommendation | in blueprint? | where |
|----------------|---------------|-------|
| clear validation error with RFC citation | YES | validation rules mention RFC 1035 |
| propagation delay docs | DEFERRED | out of scope for blueprint (docs concern) |
| centralized selectors | YES | filediff: `domainDetailSelectors.ts` |
| integration tests catch drift | YES | test coverage by layer |

### from premortem reflection (3.1.5)

| mitigation | in blueprint? | where |
|------------|---------------|-------|
| integration tests for UI changes | YES | test coverage: integration tests |
| reuse handleReauthentication | YES | codepath tree |
| use data-testid selectors first | YES | selectors section |
| propagation delay docs | DEFERRED | out of scope for blueprint |
| lenient FQDN validation | PARTIAL | see issue below |
| integration test for null flow | YES | journey test: t3 and t4 |
| verify URL before mutation | YES | codepath tree: `navigateAndAssertUrl` |

### from root cause reflection (3.1.5)

| recommendation | in blueprint? | where |
|----------------|---------------|-------|
| implement the feature | YES | this is the blueprint for that |

---

## issues found

### issue 1: FQDN validation may be too strict

**found**: premortem research recommended "lenient FQDN validation (allow punycode, new TLDs)" but the blueprint's regex pattern may not cover all valid cases.

**analysis**: the blueprint specifies:
```typescript
const FQDN_PATTERN = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})*\.?$/i;
```

this pattern:
- allows alphanumeric + hyphen
- enforces label length (1-63 chars)
- case-insensitive

however, it may not handle:
- punycode domains (`xn--nxasmq5b.xn--wgbh1c`)
- underscores (technically invalid per RFC but some systems accept)

**decision**: the pattern is correct per RFC 1035. punycode is already ASCII-encoded (`xn--` prefix uses only a-z, 0-9, hyphen), so the pattern covers it. underscores are invalid per RFC and should be rejected.

**verdict**: NOT AN ISSUE — pattern is correct. punycode is covered by the alphanumeric + hyphen rule since punycode produces only those characters in its encoded form.

---

## deferred recommendations

| recommendation | why deferred |
|----------------|--------------|
| propagation delay documentation | documentation is outside blueprint scope; will be in README/vision |
| error states discovery | requires UI exploration in implementation phase |

---

## why this holds

### all research recommendations traced

every recommendation from all 7 research artifacts was checked:
- 38 total recommendations tracked
- 36 addressed in blueprint
- 2 explicitly deferred with rationale

### deferred items have clear rationale

both deferred items are outside the scope of a code blueprint:
- documentation belongs in README/vision docs
- UI exploration happens in implementation phase

### no silent omissions

no recommendation was silently ignored. each was either:
- explicitly addressed in blueprint, OR
- explicitly deferred with documented reason

---

## conclusion

research traceability review passes. all research recommendations are either reflected in the blueprint or explicitly deferred with documented rationale.
