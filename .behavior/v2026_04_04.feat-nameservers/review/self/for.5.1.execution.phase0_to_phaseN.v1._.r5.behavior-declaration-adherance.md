# self-review: behavior-declaration-adherance (r5)

## what I checked

line-by-line review of each file changed in this PR against the vision, criteria, and blueprint. goal: detect if implementation drifted from spec.

---

## files reviewed

### src/domain.objects/DeclaredSquarespaceDomainNameservers.ts

| aspect | vision says | implementation does | drift? |
|--------|-------------|---------------------|--------|
| extends DomainEntity | yes | `extends DomainEntity<DeclaredSquarespaceDomainNameservers>` (line 24) | no |
| domain: RefByUnique | yes | `domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>` (line 14) | no |
| nameservers: string[] \| null | yes | `nameservers: string[] \| null` (line 21) | no |
| null semantics documented | yes | JSDoc at line 19: `null = squarespace default` | no |
| unique key is [domain] | yes | `public static unique = ['domain']` (line 27) | no |

**verdict**: no drift

---

### src/access/daos/DeclaredSquarespaceDomainNameserversDao.ts

| aspect | vision says | implementation does | drift? |
|--------|-------------|---------------------|--------|
| uses genDeclastructDao | yes | `genDeclastructDao<...>` (line 12) | no |
| get.one.byUnique | yes | implemented at line 19 | no |
| get.one.byPrimary | null | `byPrimary: null` (line 21) | no |
| set.findsert | yes | implemented at line 29 | no |
| set.upsert | yes | implemented at line 35 | no |
| set.delete | null | `delete: null` (line 41) | no |

**verdict**: no drift

---

### src/domain.operations/domainNameservers/getNameservers.ts

| aspect | vision says | implementation does | drift? |
|--------|-------------|---------------------|--------|
| returns DeclaredSquarespaceDomainNameservers | yes | `Promise<DeclaredSquarespaceDomainNameservers>` (line 21) | no |
| uses withNewLoggedInBrowserPage | yes | wrapper at line 46 | no |
| returns null for squarespace default | yes | via scraper result (line 38) | no |
| returns array for custom | yes | via scraper result (line 38) | no |

**verdict**: no drift

---

### src/domain.operations/domainNameservers/setNameservers.ts

| aspect | vision says | implementation does | drift? |
|--------|-------------|---------------------|--------|
| supports upsert | yes | `SetNameserversInput` at line 15 | no |
| supports findsert | yes | `SetNameserversInput` at line 15 | no |
| validates nameservers | yes | `validateNameserversInput` at line 33 | no |
| idempotent (skips if unchanged) | yes | comparison at lines 38-50 | no |
| returns entity after change | yes | `new DeclaredSquarespaceDomainNameservers` at line 69 | no |
| findsert returns extant if unchanged | yes | `return currentNameservers` at line 44 | no |

**verdict**: no drift

---

### src/domain.operations/domainNameservers/validateNameserversInput.ts

| aspect | criteria says | implementation does | drift? |
|--------|---------------|---------------------|--------|
| null is valid | yes | `return null` at line 24 | no |
| empty array to null | yes | `if (length === 0) return null` at line 27 | no |
| min 2 nameservers | yes | `throw BadRequestError` at line 31 | no |
| max 13 nameservers | yes | `throw BadRequestError` at line 39 | no |
| validates FQDN format | yes | `FQDN_PATTERN.test(ns)` at line 47 | no |

**verdict**: no drift

---

### src/access/sdks/.../getNameserversScraper.ts

| aspect | blueprint says | implementation does | drift? |
|--------|----------------|---------------------|--------|
| navigates to nameservers page | yes | `page.goto(targetUrl)` at line 24 | no |
| uses waitForSquarespaceReactRender | yes | call at line 28 | no |
| detects squarespace default via button | yes | `useSquarespaceNameserversButton.isVisible()` at line 41 | no |
| returns null for default | yes | `return { nameservers: null }` at line 49 | no |
| returns array for custom | yes | `return { nameservers: currentNameservers }` at line 63 | no |

**verdict**: no drift

---

### src/access/sdks/.../setNameserversScraper.ts

| aspect | blueprint says | implementation does | drift? |
|--------|----------------|---------------------|--------|
| handles null (reset to default) | yes | block at lines 44-87 | no |
| handles custom (fill inputs) | yes | block at lines 88-168 | no |
| handles confirmation dialogs | yes | `resetNameserversConfirmButton.click()` at line 69 | no |
| handles reauthentication | yes | `handleReauthentication` at lines 74, 130, 163 | no |
| verifies result via reload | yes | `page.reload()` at line 171 | no |

**verdict**: no drift

---

## test coverage adherance

### validateNameserversInput.test.ts

| criterion | test exists | assertion correct |
|-----------|-------------|-------------------|
| valid 2 NS | case1/when 2 | expects array returned |
| valid 13 NS | case1/when 13 | expects array of 13 |
| < 2 NS fails | case2 | expects BadRequestError with message |
| invalid FQDN fails | case3 | expects BadRequestError with message |
| [] to null | case4/when empty | expects null |
| null returns null | case4/when null | expects null |
| > 13 NS fails | case5 | expects BadRequestError with message |

**verdict**: all criteria covered with correct assertions

---

### DeclaredSquarespaceDomainNameservers.test.ts

| criterion | test exists | assertion correct |
|-----------|-------------|-------------------|
| instantiation with null | when squarespace default | expects nameservers null |
| instantiation with array | when custom | expects nameservers array |
| unique key is domain | when static properties | expects ['domain'] |

**verdict**: domain object tests match vision

---

### setNameservers.play.integration.test.ts

| criterion | test exists | assertion correct |
|-----------|-------------|-------------------|
| t0: getNameservers returns null | when before changes | expects null |
| t1: upsert to cloudflare | when upsert to cloudflare | expects CLOUDFLARE_NS |
| t2: verify after change | when getNameservers after | expects CLOUDFLARE_NS |
| t3: upsert back to null | when upsert to null | expects null |
| t4: verify after reset | when getNameservers after | expects null |
| findsert returns extant | case2/t0 | expects unchanged |

**verdict**: journey test matches blackbox criteria exactly

---

## deviation check

### getNameserversScraper vs scrapeDomainDetail

blueprint said GET reuses `scrapeDomainDetail`. implementation created separate `getNameserversScraper.ts`.

**is this a drift?** no — this is a justified deviation documented in previous reviews (r4, r5).

**reason**: `scrapeDomainDetail` returns `nameservers: string[]` (always array). the null semantics require a button visibility check on the nameservers page. this check is not possible via `scrapeDomainDetail`.

---

## summary

| file | drift detected |
|------|----------------|
| DeclaredSquarespaceDomainNameservers.ts | no |
| DeclaredSquarespaceDomainNameserversDao.ts | no |
| getNameservers.ts | no |
| setNameservers.ts | no |
| validateNameserversInput.ts | no |
| getNameserversScraper.ts | no (justified deviation) |
| setNameserversScraper.ts | no |
| validateNameserversInput.test.ts | no |
| DeclaredSquarespaceDomainNameservers.test.ts | no |
| setNameservers.play.integration.test.ts | no |

---

## conclusion

implementation adheres to behavior declaration:
- all vision requirements implemented as specified
- all blackbox criteria tested with correct assertions
- all blueprint structure followed
- one deviation (separate scraper) is justified and documented
- no drift detected in any file
