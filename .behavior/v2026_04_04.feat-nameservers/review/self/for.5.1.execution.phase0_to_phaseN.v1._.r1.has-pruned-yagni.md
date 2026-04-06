# self-review: has-pruned-yagni (r1)

## what I reviewed

I compared the executed implementation against the blueprint filediff tree to identify any extras that were not prescribed.

---

## the question I asked

> "did we add files or features not specified in the blueprint?"

---

## yagni suspects examined

### suspect 1: getNameserversScraper.ts (deviation from blueprint)

**the audit**:
- blueprint says: "GET reuses extant `scrapeDomainDetail`"
- execution created: `src/access/sdks/squarespace.via.playwright/domainNameservers/getNameserversScraper.ts`
- this is a NEW file not in the blueprint filediff tree

**why I thought it might be YAGNI**:
- blueprint explicitly said to reuse extant `scrapeDomainDetail`
- a new scraper is more code than reuse
- could be "while we're here" work

**investigation**:
- `scrapeDomainDetail` scrapes from `/domains/managed/{domain}` (main detail page)
- `scrapeDomainDetail` returns `nameservers: string[]` (always an array)
- the vision requires `nameservers: null` for squarespace default vs `string[]` for custom
- to determine null vs array, need to check button visibility on `/dns/domain-nameservers` page
- the "USE SQUARESPACE NAMESERVERS" button is visible only when custom NS are configured
- `scrapeDomainDetail` cannot provide this information

**why it's NOT YAGNI**:
1. blueprint assumption was incorrect - `scrapeDomainDetail` cannot determine null vs custom
2. separate page (`/dns/domain-nameservers`) required to detect nameserver type
3. button visibility check is the only reliable way to distinguish squarespace default vs custom
4. the deviation was necessary, not optional

**verdict**: NOT YAGNI - necessary deviation from blueprint due to technical requirements.

**lesson**: blueprint assumed `scrapeDomainDetail` had enough info, but it doesn't. execution discovered this gap.

---

### suspect 2: all other files

**the audit**:

| file | in blueprint? | verdict |
|------|---------------|---------|
| `DeclaredSquarespaceDomainNameservers.ts` | yes | prescribed |
| `DeclaredSquarespaceDomainNameservers.test.ts` | yes | prescribed |
| `castIntoDeclaredSquarespaceDomainNameservers.ts` | yes | prescribed |
| `castIntoDeclaredSquarespaceDomainNameservers.test.ts` | yes | prescribed |
| `validateNameserversInput.ts` | yes (implied) | prescribed |
| `validateNameserversInput.test.ts` | yes | prescribed |
| `getNameservers.ts` | yes | prescribed |
| `getNameservers.test.ts` | yes | prescribed |
| `getNameservers.integration.test.ts` | yes | prescribed |
| `setNameservers.ts` | yes | prescribed |
| `setNameservers.test.ts` | yes | prescribed |
| `setNameservers.play.integration.test.ts` | yes | prescribed |
| `setNameserversScraper.ts` | yes | prescribed |
| `setNameserversScraper.integration.test.ts` | yes | prescribed |
| `DeclaredSquarespaceDomainNameserversDao.ts` | yes | prescribed |
| `DeclaredSquarespaceDomainNameserversDao.integration.test.ts` | yes | prescribed |
| `domainDetailSelectors.ts` (updated) | yes | prescribed |

**verdict**: all files match blueprint except for the one justified deviation.

---

### suspect 3: handleReauthentication.ts fix

**the audit**:
- in integration test execution, reauth submit button failed with "Element is outside of the viewport"
- fix applied: changed from `click({ force: true })` to `evaluate((el) => el.click())`
- this is a fix to EXTANT code, not nameservers-specific

**why I thought it might be scope creep**:
- modified a file outside the nameservers feature
- could be "while we're here" fix

**why it's NOT YAGNI**:
1. the fix was required to make nameservers integration tests pass
2. reauth modal appears after nameserver changes
3. without the fix, nameservers feature would not work
4. the fix is minimal and correct (bypasses viewport constraint for iframe buttons)

**verdict**: NOT YAGNI - necessary fix discovered in feature tests.

---

## what I actually found

### found: one justified deviation

`getNameserversScraper.ts` was created instead of reuse of `scrapeDomainDetail` because:
- blueprint assumption was technically incorrect
- the main domain page does not expose null vs custom semantics
- a dedicated scraper was required

**action**: none needed - deviation is correct.

### found: no unjustified additions

all other files match the blueprint exactly:
- no extra operations
- no extra validation rules beyond min 2, max 13, FQDN format
- no extra selectors
- no extra error handle

---

## why the execution has no yagni

### the filediff test

| blueprint file | created? | verdict |
|----------------|----------|---------|
| `DeclaredSquarespaceDomainNameservers.ts` | yes | match |
| `DeclaredSquarespaceDomainNameservers.test.ts` | yes | match |
| `castIntoDeclaredSquarespaceDomainNameservers.ts` | yes | match |
| `castIntoDeclaredSquarespaceDomainNameservers.test.ts` | yes | match |
| `validateNameserversInput.ts` | yes | match |
| `validateNameserversInput.test.ts` | yes | match |
| `getNameservers.ts` | yes | match |
| `getNameservers.test.ts` | yes | match |
| `getNameservers.integration.test.ts` | yes | match |
| `setNameservers.ts` | yes | match |
| `setNameservers.test.ts` | yes | match |
| `setNameservers.play.integration.test.ts` | yes | match |
| `setNameserversScraper.ts` | yes | match |
| `setNameserversScraper.integration.test.ts` | yes | match |
| `DeclaredSquarespaceDomainNameserversDao.ts` | yes | match |
| `DeclaredSquarespaceDomainNameserversDao.integration.test.ts` | yes | match |
| `domainDetailSelectors.ts` (updated) | yes | match |

**extra file**: `getNameserversScraper.ts` - justified deviation.

### the "while we're here" test

- extra validation rules? no - only min 2, max 13, FQDN format (as prescribed)
- extra operations? no - only get and set (as prescribed)
- extra scrapers? yes - but justified (see suspect 1)
- extra selectors? no - only those needed for the feature
- extra error handle? no - fail-fast only

---

## what I learned

### lesson 1: blueprint assumptions may be incorrect

the blueprint assumed `scrapeDomainDetail` could provide null vs custom semantics. execution discovered this was technically incorrect. deviations from blueprint are acceptable when technically necessary.

### lesson 2: integration tests reveal gaps

the `handleReauthentication.ts` fix was discovered in integration tests. tests at the right level (integration, not unit) exposed the real-world constraint.

---

## conclusion

yagni review passes:
- 3 suspects examined
- 0 confirmed YAGNI
- 1 justified deviation (getNameserversScraper.ts)
- 1 necessary fix (handleReauthentication.ts)
- all other files match blueprint exactly
