# self-review: has-divergence-analysis (r1)

## review approach

go through blueprint line-by-line and compare against implementation. assume a detail was missed.

---

## summary comparison

| blueprint says | implementation does | match? |
|----------------|---------------------|--------|
| new domain object: DeclaredSquarespaceDomainNameservers | created at src/domain.objects/ | yes |
| new DAO via genDeclastructDao | created at src/access/daos/ | yes |
| new operations: getNameservers, setNameservers | created at src/domain.operations/domainNameservers/ | yes |
| new scraper: setNameserversScraper | created at src/access/sdks/.../domainNameservers/ | yes |
| GET reuses scrapeDomainDetail | separate getNameserversScraper created | DIVERGENCE |
| updated selectors: domainDetailSelectors.ts | modified | yes |

---

## filediff comparison

### blueprint declared

```
domain.objects/
  [+] DeclaredSquarespaceDomainNameservers.ts
  [+] DeclaredSquarespaceDomainNameservers.test.ts

domain.operations/domainNameservers/
  [+] castIntoDeclaredSquarespaceDomainNameservers.ts
  [+] castIntoDeclaredSquarespaceDomainNameservers.test.ts
  [+] getNameservers.ts
  [+] getNameservers.test.ts
  [+] getNameservers.integration.test.ts
  [+] setNameservers.ts
  [+] setNameservers.test.ts
  [+] setNameservers.play.integration.test.ts

access/daos/
  [+] DeclaredSquarespaceDomainNameserversDao.ts
  [+] DeclaredSquarespaceDomainNameserversDao.integration.test.ts

access/sdks/.../domainNameservers/
  [+] setNameserversScraper.ts
  [+] setNameserversScraper.integration.test.ts

selectors/
  [~] domainDetailSelectors.ts
```

### implementation has

all of the above PLUS:
- `[+] validateNameserversInput.ts` — not in filediff tree but in codepath tree
- `[+] validateNameserversInput.test.ts` — not in filediff tree but in test coverage
- `[+] getNameserversScraper.ts` — DIVERGENCE (blueprint said reuse scrapeDomainDetail)

---

## codepath comparison

| blueprint codepath | implementation codepath | match? |
|--------------------|------------------------|--------|
| DeclaredSquarespaceDomainNameservers | yes | yes |
| getNameservers orchestrator | yes | yes |
| setNameservers orchestrator | yes | yes |
| DeclaredSquarespaceDomainNameserversDao | yes | yes |
| setNameserversScraper communicator | yes | yes |
| domainDetailSelectors updates | yes | yes |
| GET uses scrapeDomainDetail | GET uses getNameserversScraper | DIVERGENCE |
| validateNameserversInput transformer | yes | yes |

---

## test coverage comparison

| blueprint test | implementation test | match? |
|----------------|---------------------|--------|
| DeclaredSquarespaceDomainNameservers.test.ts | yes | yes |
| castIntoDeclaredSquarespaceDomainNameservers.test.ts | yes | yes |
| validateNameserversInput.test.ts | yes | yes |
| getNameservers.test.ts | yes | yes |
| getNameservers.integration.test.ts | yes | yes |
| setNameservers.test.ts | yes | yes |
| setNameservers.play.integration.test.ts | yes | yes |
| setNameserversScraper.integration.test.ts | yes | yes |
| DeclaredSquarespaceDomainNameserversDao.integration.test.ts | yes | yes |

---

## divergences found

| divergence | documented in evaluation? |
|------------|---------------------------|
| GET uses separate scraper instead of scrapeDomainDetail | yes, with justification |
| validateNameserversInput.ts not in blueprint filediff tree | yes, noted as "implied by codepath tree" |
| getNameserversScraper.ts not in blueprint filediff tree | yes, noted as "consequence of GET divergence" |

---

## hostile reviewer check

**what would they find?**

1. "blueprint said GET reuses scrapeDomainDetail but you created a new scraper"
   - **answer:** documented. justified because scrapeDomainDetail returns string[] always, cannot detect null (squarespace default) vs custom NS. button visibility check requires separate page.

2. "validateNameserversInput not in blueprint filediff but you created it"
   - **answer:** documented. blueprint codepath tree mentions it, filediff tree omission was oversight in blueprint, not implementation deviation.

3. "why is getNameserversScraper.ts not in blueprint?"
   - **answer:** documented. consequence of the scrapeDomainDetail divergence.

---

## issues found

none. all divergences were identified and documented in the evaluation with justification.

---

## why it holds

1. **summary divergences:** one divergence (GET scraper) — documented
2. **filediff divergences:** two files added beyond blueprint — both documented
3. **codepath divergences:** one deviation (separate scraper) — documented
4. **test coverage divergences:** none — all tests match blueprint

the divergence analysis is complete. a hostile reviewer would find the same three items, all of which are already documented with justification.
