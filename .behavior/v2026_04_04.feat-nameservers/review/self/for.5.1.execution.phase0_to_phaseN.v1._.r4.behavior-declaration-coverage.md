# self-review: behavior-declaration-coverage (r4)

## what I reviewed

I checked the vision, blackbox criteria, blueprint criteria, and blueprint against the implemented code.

---

## vision coverage

### vision requirement 1: declarative control over domain nameservers

**requirement**: `DeclaredSquarespaceDomainNameservers` entity

**verification**:
- [x] `src/domain.objects/DeclaredSquarespaceDomainNameservers.ts` created
- [x] interface has `domain: RefByUnique<...>` and `nameservers: string[] | null`
- [x] class extends `DomainEntity`

**status**: SATISFIED

---

### vision requirement 2: DAO via genDeclastructDao

**requirement**: `DeclaredSquarespaceDomainNameserversDao`

**verification**:
- [x] `src/access/daos/DeclaredSquarespaceDomainNameserversDao.ts` created
- [x] uses `genDeclastructDao`
- [x] exposes `get.one.byUnique`
- [x] exposes `set.findsert` and `set.upsert`
- [x] `set.delete` is null (as specified)

**status**: SATISFIED

---

### vision requirement 3: setNameservers operations

**requirement**:
- `setNameservers({ upsert: { domain: { name }, nameservers: [...] } })` — swap to custom
- `setNameservers({ upsert: { domain: { name }, nameservers: null } })` — swap back to default

**verification**:
- [x] `src/domain.operations/domainNameservers/setNameservers.ts` created
- [x] supports `upsert` input
- [x] supports `findsert` input
- [x] custom nameservers array sets to cloudflare etc
- [x] null nameservers resets to squarespace default

**status**: SATISFIED

---

### vision requirement 4: getNameservers operation

**requirement**: retrieve current nameserver configuration

**verification**:
- [x] `src/domain.operations/domainNameservers/getNameservers.ts` created
- [x] returns `DeclaredSquarespaceDomainNameservers`
- [x] returns `nameservers: null` for squarespace default
- [x] returns `nameservers: [...]` for custom

**status**: SATISFIED

---

### vision requirement 5: null semantics

**requirement**:
- `null` = squarespace default nameservers
- `[...]` = custom nameservers

**verification**:
- [x] documented in domain object JSDoc
- [x] validated in `validateNameserversInput.ts`
- [x] implemented in scrapers via button visibility check

**status**: SATISFIED

---

### vision requirement 6: empty array normalization

**requirement**: `[]` (empty array) treated as `null` (squarespace default)

**verification**:
- [x] `validateNameserversInput.ts` checks `if (input.length === 0) return { normalized: null }`
- [x] unit tests cover this case

**status**: SATISFIED

---

## blackbox criteria coverage

### usecase.1 = get nameservers

| criterion | satisfied? | evidence |
|-----------|------------|----------|
| default NS → returns null | yes | getNameservers.integration.test.ts |
| custom NS → returns array | yes | getNameservers.integration.test.ts |

---

### usecase.2 = set custom nameservers

| criterion | satisfied? | evidence |
|-----------|------------|----------|
| upsert to custom works | yes | setNameservers.play.integration.test.ts |
| operation is idempotent | yes | scraper verifies result after change |
| can switch between providers | yes | tested in journey test |

---

### usecase.3 = reset to squarespace default

| criterion | satisfied? | evidence |
|-----------|------------|----------|
| upsert null resets | yes | setNameservers.play.integration.test.ts |
| operation is idempotent | yes | scraper handles "already default" case |
| no-op when already default | yes | scraper checks button visibility |

---

### usecase.4 = validation edgecases

| criterion | satisfied? | evidence |
|-----------|------------|----------|
| < 2 NS fails | yes | validateNameserversInput.test.ts |
| invalid FQDN fails | yes | validateNameserversInput.test.ts |
| empty array → null | yes | validateNameserversInput.test.ts |

---

### usecase.5 = findsert semantics

| criterion | satisfied? | evidence |
|-----------|------------|----------|
| creates when absent | yes | DAO.integration.test.ts |
| returns extant unchanged | yes | DAO.integration.test.ts |

---

## blueprint criteria coverage

### subcomponent contracts

| contract | implemented? | file |
|----------|--------------|------|
| DeclaredSquarespaceDomainNameservers domain object | yes | src/domain.objects/ |
| getNameservers operation | yes | src/domain.operations/domainNameservers/ |
| setNameservers operation | yes | src/domain.operations/domainNameservers/ |
| DeclaredSquarespaceDomainNameserversDao | yes | src/access/daos/ |

---

### composition boundaries

| boundary | implemented? | file |
|----------|--------------|------|
| domain object in src/domain.objects/ | yes | DeclaredSquarespaceDomainNameservers.ts |
| DAO in src/access/daos/ | yes | DeclaredSquarespaceDomainNameserversDao.ts |
| operations in src/domain.operations/ | yes | domainNameservers/ folder |
| scraper in SDK | yes | domainNameservers/ folder in playwright SDK |

---

### test coverage criteria

| test | exists? | file |
|------|---------|------|
| domain object unit test | yes | DeclaredSquarespaceDomainNameservers.test.ts |
| getNameservers integration test | yes | getNameservers.integration.test.ts |
| setNameservers integration test | yes | setNameservers.play.integration.test.ts |
| validation unit tests | yes | validateNameserversInput.test.ts |
| DAO integration tests | yes | DeclaredSquarespaceDomainNameserversDao.integration.test.ts |
| scraper integration test | yes | setNameserversScraper.integration.test.ts |

---

## blueprint filediff tree coverage

| blueprint file | created? |
|----------------|----------|
| DeclaredSquarespaceDomainNameservers.ts | yes |
| DeclaredSquarespaceDomainNameservers.test.ts | yes |
| castIntoDeclaredSquarespaceDomainNameservers.ts | yes |
| castIntoDeclaredSquarespaceDomainNameservers.test.ts | yes |
| validateNameserversInput.ts | yes |
| validateNameserversInput.test.ts | yes |
| getNameservers.ts | yes |
| getNameservers.test.ts | yes |
| getNameservers.integration.test.ts | yes |
| setNameservers.ts | yes |
| setNameservers.test.ts | yes |
| setNameservers.play.integration.test.ts | yes |
| setNameserversScraper.ts | yes |
| setNameserversScraper.integration.test.ts | yes |
| DeclaredSquarespaceDomainNameserversDao.ts | yes |
| DeclaredSquarespaceDomainNameserversDao.integration.test.ts | yes |
| domainDetailSelectors.ts (updated) | yes |
| getNameserversScraper.ts (deviation from blueprint) | yes (justified) |

---

## deviations from blueprint

### deviation 1: getNameserversScraper.ts

**blueprint said**: GET reuses extant `scrapeDomainDetail`

**implementation**: created separate `getNameserversScraper.ts`

**reason**: `scrapeDomainDetail` returns `nameservers: string[]` (always array). we need `nameservers: string[] | null` to distinguish squarespace default from custom. the button visibility check on nameservers page is the only way to determine this.

**verdict**: JUSTIFIED deviation. documented in YAGNI review.

---

## summary

| category | coverage |
|----------|----------|
| vision requirements | 6/6 satisfied |
| blackbox usecases | 5/5 satisfied |
| blueprint criteria | all satisfied |
| test coverage | all tests created |
| filediff tree | all files created |
| deviations | 1 justified deviation |

---

## conclusion

behavior declaration coverage passes:
- all vision requirements implemented
- all blackbox criteria satisfied
- all blueprint components created
- all tests exist
- one deviation (getNameserversScraper) justified and documented

