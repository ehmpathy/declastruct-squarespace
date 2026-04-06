# self-review: has-divergence-analysis (r2)

## review approach

re-examine the divergence analysis in r1. ask: what would a hostile reviewer find that was missed?

---

## divergences identified in evaluation

| divergence | documented? | justified? |
|------------|-------------|------------|
| GET uses separate scraper instead of scrapeDomainDetail | yes | yes |
| validateNameserversInput.ts not in blueprint filediff tree | yes | yes |
| getNameserversScraper.ts not in blueprint filediff tree | yes | yes |

---

## hostile reviewer challenge

**what would they probe?**

1. "why is a separate scraper justified? isn't that scope creep?"

   **defense:**
   - scrapeDomainDetail returns `string[]` — it cannot represent `null`
   - squarespace default nameservers must be detectable as `null`, not as an empty array or default values
   - the "Use Squarespace Nameservers" button visibility distinguishes custom NS from default NS
   - this button check requires navigation to `/dns/domain-nameservers` page
   - scrapeDomainDetail operates on `/domains/managed/{domain}`, not the NS page
   - reuse would require a type-incompatible change to scrapeDomainDetail's return type
   - such a change would affect all extant callers
   - separate scraper isolates the change

2. "why is validateNameserversInput not in the blueprint filediff tree?"

   **defense:**
   - blueprint codepath tree mentions validateNameserversInput explicitly
   - blueprint test coverage mentions validateNameserversInput.test.ts explicitly
   - the filediff tree omission was a documentation gap, not an implementation deviation
   - the operation was always implied by the codepath and test declarations

3. "why is getNameserversScraper not in the blueprint filediff tree?"

   **defense:**
   - this follows from the justified divergence on GET semantics
   - once we committed to a separate GET scraper for null detection, the file was required
   - the blueprint didn't anticipate this need because it assumed scrapeDomainDetail could detect null

---

## cross-check: blueprint sections vs implementation

### summary comparison

| blueprint says | implementation does | match? |
|----------------|---------------------|--------|
| DeclaredSquarespaceDomainNameservers domain object | created at src/domain.objects/ | yes |
| DAO via genDeclastructDao | created at src/access/daos/ | yes |
| getNameservers, setNameservers operations | created at src/domain.operations/domainNameservers/ | yes |
| setNameserversScraper communicator | created at src/access/sdks/.../domainNameservers/ | yes |
| GET reuses scrapeDomainDetail | separate getNameserversScraper created | DIVERGENCE (justified) |
| domainDetailSelectors updates | modified | yes |

### filediff comparison

| blueprint declares | implementation has | match? |
|-------------------|--------------------|--------|
| DeclaredSquarespaceDomainNameservers.ts | yes | yes |
| DeclaredSquarespaceDomainNameservers.test.ts | yes | yes |
| castIntoDeclaredSquarespaceDomainNameservers.ts | yes | yes |
| castIntoDeclaredSquarespaceDomainNameservers.test.ts | yes | yes |
| getNameservers.ts | yes | yes |
| getNameservers.test.ts | yes | yes |
| getNameservers.integration.test.ts | yes | yes |
| setNameservers.ts | yes | yes |
| setNameservers.test.ts | yes | yes |
| setNameservers.play.integration.test.ts | yes | yes |
| DeclaredSquarespaceDomainNameserversDao.ts | yes | yes |
| DeclaredSquarespaceDomainNameserversDao.integration.test.ts | yes | yes |
| setNameserversScraper.ts | yes | yes |
| setNameserversScraper.integration.test.ts | yes | yes |
| domainDetailSelectors.ts [~] | yes | yes |
| validateNameserversInput.ts | yes | ADDED (implied) |
| validateNameserversInput.test.ts | yes | ADDED (implied) |
| getNameserversScraper.ts | yes | ADDED (divergence) |

### codepath comparison

all codepaths in blueprint are present. the getNameserversScraper addition is a consequence of the justified divergence.

### test coverage comparison

all tests in blueprint are present. no missing coverage.

---

## issues found

none. all divergences were already identified and documented with justification in r1.

---

## why it holds

1. **the divergence is contained**: only the GET path diverged, SET path matches blueprint exactly
2. **the divergence is justified**: null detection requires button visibility check that scrapeDomainDetail cannot provide
3. **the divergence is documented**: evaluation explicitly lists this as "justified deviation" with rationale
4. **the filediff gaps are implicit, not omissions**: validateNameserversInput was in codepath+test sections
5. **no hidden divergences**: hostile reviewer challenge found the same three items already documented

the divergence analysis is complete. a reviewer who examines both blueprint and implementation will find the same three items, all already documented with justification.

