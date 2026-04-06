# self-review: has-thorough-test-coverage (r6)

## what I reviewed

I examined the blueprint's test coverage declaration against the layer requirements, case coverage, and snapshot requirements.

---

## layer coverage audit

### required test types by layer

| layer | required | blueprint declares |
|-------|----------|-------------------|
| transformers | unit | unit ✓ |
| communicators | integration | integration ✓ |
| orchestrators | integration | integration ✓ |
| contracts | integration + acceptance | N/A (no contracts) |

### detailed examination

#### transformers (pure computation)

| transformer | declared test | correct? |
|-------------|---------------|----------|
| `castIntoDeclaredSquarespaceDomainNameservers` | unit test | ✓ |
| `validateNameserversInput` | unit test | ✓ |

**verdict**: transformers correctly covered by unit tests.

#### communicators (i/o boundaries)

| communicator | declared test | correct? |
|--------------|---------------|----------|
| `scrapeNameservers` | integration test | ✓ |
| `setNameserversScraper` | integration test | ✓ |

**verdict**: communicators correctly covered by integration tests.

#### orchestrators (composition)

| orchestrator | declared test | correct? |
|--------------|---------------|----------|
| `getNameservers` | unit + integration | ✓ |
| `setNameservers` | unit + integration | ✓ |

**verdict**: orchestrators correctly covered by integration tests. unit tests for "logic paths" are bonus coverage.

#### domain object

| component | declared test | correct? |
|-----------|---------------|----------|
| `DeclaredSquarespaceDomainNameservers` | unit test | ✓ |

**verdict**: domain object correctly covered by unit test for instantiation.

#### DAO

| component | declared test | concern? |
|-----------|---------------|----------|
| `DeclaredSquarespaceDomainNameserversDao` | "no test (wrapper only)" | potential gap |

**investigation**: the blueprint criteria (2.3.criteria.blueprint) states:
```
given('DeclaredSquarespaceDomainNameserversDao')
  then('has integration test: get.one.byUnique')
  then('has integration test: set.upsert')
  then('has integration test: set.findsert')
```

**the question**: is "no test (wrapper only)" acceptable?

**analysis**:
- the DAO is a thin wrapper via `genDeclastructDao`
- it delegates directly to `getNameservers` and `setNameservers`
- those operations have integration tests
- DAO tests would test the same code paths

**however**: the criteria explicitly requires DAO integration tests. the blueprint contradicts the criteria.

**verdict**: GAP FOUND. blueprint must declare DAO integration tests to satisfy criteria.

---

## case coverage audit

### positive cases

| operation | positive cases declared |
|-----------|------------------------|
| `getNameservers` | returns null for default, returns array for custom |
| `setNameservers.upsert` | sets custom NS, resets to null |
| `setNameservers.findsert` | creates when absent |
| `validateNameserversInput` | valid FQDN passes |

**verdict**: positive cases adequately declared.

### negative cases

| operation | negative cases declared |
|-----------|------------------------|
| `getNameservers` | domain not found |
| `setNameservers.upsert` | < 2 NS, invalid FQDN |
| `setNameservers.findsert` | < 2 NS, invalid FQDN |
| `validateNameserversInput` | < 2 NS, invalid FQDN |

**verdict**: negative cases adequately declared.

### edge cases

| operation | edge cases declared |
|-----------|---------------------|
| `getNameservers` | - (none identified) |
| `setNameservers.upsert` | empty array → null |
| `setNameservers.findsert` | returns extant unchanged |
| `validateNameserversInput` | empty array, null, 13+ NS |

**verdict**: edge cases adequately declared.

---

## snapshot coverage audit

### does this feature have contracts?

the blueprint creates:
- domain object (not a contract)
- DAO (internal, not a contract)
- operations (internal, not a contract)
- scrapers (internal, not a contract)

**no CLI commands, API endpoints, or SDK exports are created.**

the feature is domain-level infrastructure. it will be consumed by future CLI/API contracts, but the blueprint itself doesn't create those.

**verdict**: snapshot coverage N/A — no contracts created in this blueprint.

---

## test tree audit

### declared test files

```
DeclaredSquarespaceDomainNameservers.test.ts          # unit
castIntoDeclaredSquarespaceDomainNameservers.test.ts  # unit
validateNameserversInput.test.ts                       # unit
getNameservers.test.ts                                 # unit
getNameservers.integration.test.ts                     # integration
setNameservers.test.ts                                 # unit
setNameservers.play.integration.test.ts               # integration (journey)
scrapeNameservers.integration.test.ts                  # integration
setNameserversScraper.integration.test.ts              # integration
```

### test file locations

all test files are collocated with their implementation:
- domain.objects/*.test.ts ✓
- domain.operations/domainNameservers/*.test.ts ✓
- access/sdks/squarespace.via.playwright/domainNameservers/*.integration.test.ts ✓

**verdict**: test file locations follow convention.

---

## gap found: DAO integration tests

### the gap

blueprint says:
> `DeclaredSquarespaceDomainNameserversDao.ts # no test (wrapper only)`

criteria says:
> `DeclaredSquarespaceDomainNameserversDao` has integration tests for get.one.byUnique, set.upsert, set.findsert

### how to fix

add to the test tree:

```
src/access/daos/
├── [+] DeclaredSquarespaceDomainNameserversDao.ts
└── [+] DeclaredSquarespaceDomainNameserversDao.integration.test.ts  # integration: DAO methods
```

add to coverage by case:

```
| `DeclaredSquarespaceDomainNameserversDao.get.one.byUnique` | returns entity or null | - | - |
| `DeclaredSquarespaceDomainNameserversDao.set.upsert` | creates or updates | - | - |
| `DeclaredSquarespaceDomainNameserversDao.set.findsert` | creates or returns extant | - | - |
```

### why this matters

the criteria was authored in the vision/criteria phase. it explicitly requires DAO tests. the blueprint phase cannot unilaterally decide to skip those tests.

even if the tests are "redundant" (same code paths as operation tests), the criteria contract requires them.

---

## what I learned

### lesson 1: criteria is the contract

the blueprint must satisfy criteria. if criteria says "has integration test for X", the blueprint must declare that test. "wrapper only" is not an escape clause.

### lesson 2: redundant tests can be valuable

DAO tests may exercise the same code as operation tests, but they verify:
- the DAO connection is correct
- `genDeclastructDao` was used properly
- the DAO contract matches expectations

this is regression protection, not redundancy.

### lesson 3: check criteria before "no test"

before I write "no test (wrapper only)", I should check if criteria explicitly requires tests for that component.

---

## fix applied

updated blueprint 3.3.1.blueprint.product.v1.i1.md:
- added `DeclaredSquarespaceDomainNameserversDao.integration.test.ts` to filediff tree
- updated test tree to include DAO integration test
- added DAO operations to coverage by case table

---

## conclusion

test coverage review passes after fix:
- 1 gap found and fixed (DAO integration tests)

layer coverage: ✓ (all layers have correct test types)
case coverage: ✓ (positive, negative, edge cases declared)
snapshot coverage: N/A (no contracts)
test tree: ✓ (all components have declared tests)
