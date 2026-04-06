# self-review: role-standards-coverage (r7)

## rule directories checked

| directory | rules examined | applies to |
|-----------|----------------|------------|
| code.prod/evolvable.domain.objects/ | ref requirements, null semantics | DeclaredSquarespaceDomainNameservers |
| code.prod/evolvable.procedures/ | hook wrapper, input-context, arrow-only | all operations |
| code.prod/pitofsuccess.errors/ | failfast, failloud | validation, error paths |
| code.prod/pitofsuccess.procedures/ | idempotent mutations | setNameservers |
| code.prod/readable.narrative/ | no else, code paragraphs | all files |
| code.test/frames.behavior/ | given/when/then, useBeforeAll | all test files |
| code.test/scope.coverage/ | test by grain | transformers, orchestrators |

---

## coverage check: domain object

### DeclaredSquarespaceDomainNameservers.ts

| pattern | present? | evidence |
|---------|----------|----------|
| extends DomainEntity | yes | line 24 |
| static unique = [...] | yes | line 27: `['domain']` |
| static primary | no | not needed — squarespace has no stable ID |
| RefByUnique for ref | yes | line 14 |
| JSDoc .what/.why | yes | lines 5-9 |
| null semantics doc | yes | lines 17-21 |

**coverage complete.**

---

## coverage check: DAO

### DeclaredSquarespaceDomainNameserversDao.ts

| pattern | present? | evidence |
|---------|----------|----------|
| genDeclastructDao | yes | line 12 |
| get.one.byUnique | yes | line 19 |
| get.one.byPrimary | null | correct — no primary key |
| set.findsert | yes | line 29 |
| set.upsert | yes | line 35 |
| set.delete | null | correct — cannot delete NS config |
| JSDoc .what/.why | yes | lines 8-11, 25-28, 31-34, 37-40 |

**coverage complete.**

---

## coverage check: operations

### getNameservers.ts

| pattern | present? | evidence |
|---------|----------|----------|
| (input, context) | yes | lines 14-21 |
| arrow function | yes | `const getNameserversCore = async` |
| hook wrapper | yes | line 46: withNewLoggedInBrowserPage |
| code paragraphs | yes | lines 24, 27, 33 |
| JSDoc .what/.why | yes | lines 10-13, 42-45 |
| RefByUnique.as | yes | lines 35-37 |

**coverage complete.**

### setNameservers.ts

| pattern | present? | evidence |
|---------|----------|----------|
| (input, context) | yes | lines 24-27, 80-83 |
| arrow function | yes | `const setNameserversCore = async` |
| hook wrapper | yes | line 109: withNewLoggedInBrowserPage |
| failfast validation | yes | lines 88-91, 94 |
| idempotent check | yes | lines 38-51 (skip if unchanged) |
| code paragraphs | yes | lines 32, 37, 42, 47, 52, etc. |
| JSDoc .what/.why | yes | lines 20-23, 75-79, 120-123 |
| RefByUnique.as | yes | lines 70-72 (fixed in r6) |

**coverage complete.**

### validateNameserversInput.ts

| pattern | present? | evidence |
|---------|----------|----------|
| (input) pattern | yes | line 20 |
| arrow function | yes | `const validateNameserversInput =` |
| failfast | yes | BadRequestError at lines 31, 39, 48 |
| early returns | yes | lines 24, 27 |
| JSDoc .what/.why | yes | lines 9-19 |
| no else | yes | uses if guards only |

**coverage complete.**

---

## coverage check: scrapers

### getNameserversScraper.ts

| pattern | present? | evidence |
|---------|----------|----------|
| (input) pattern | yes | line 13 |
| arrow function | yes | `const getNameserversScraper = async` |
| waitForSquarespaceReactRender | yes | line 28 |
| navigateAndAssertUrl | yes | lines 21-26 |
| code paragraphs | yes | lines 22, 27, 37, 47, 54 |
| JSDoc .what/.why/.note | yes | lines 8-12 |
| early return | yes | line 48 |

**coverage complete.**

### setNameserversScraper.ts

| pattern | present? | evidence |
|---------|----------|----------|
| (input) pattern | yes | line 15 |
| arrow function | yes | `const setNameserversScraper = async` |
| waitForSquarespaceReactRender | yes | lines 34, 176 |
| handleReauthentication | yes | lines 73, 134, 167 |
| verification after action | yes | lines 174-223 |
| code paragraphs | yes | lines 27, 33, 43, 91, 174, etc. |
| JSDoc .what/.why/.note | yes | lines 10-14 |
| no else | yes | separate if guards (fixed in r6) |

**coverage complete.**

---

## coverage check: tests

### validateNameserversInput.test.ts

| case | covered? | lines |
|------|----------|-------|
| valid 2 NS | yes | case1 |
| valid 13 NS | yes | case1 |
| < 2 NS fails | yes | case2 |
| invalid FQDN | yes | case3 |
| empty array to null | yes | case4 |
| null returns null | yes | case4 |
| > 13 NS fails | yes | case5 |

**coverage complete.**

### DeclaredSquarespaceDomainNameservers.test.ts

| case | covered? | lines |
|------|----------|-------|
| instantiation with null | yes | when squarespace default |
| instantiation with array | yes | when custom |
| unique key | yes | when static properties |

**coverage complete.**

### setNameservers.play.integration.test.ts

| case | covered? |
|------|----------|
| t0: get returns null | yes |
| t1: upsert to cloudflare | yes |
| t2: verify after change | yes |
| t3: upsert back to null | yes |
| t4: verify after reset | yes |
| findsert returns extant | yes |

**coverage complete.**

---

## gaps found

none. all patterns required by mechanic standards are present.

---

## conclusion

full coverage verified:
- domain object has all required patterns
- DAO exposes correct methods, nulls correct unsupported
- operations follow (input, context), hook wrapper, failfast
- scrapers use waitForSquarespaceReactRender, handleReauthentication, verify after action
- tests cover all cases with BDD pattern

no gaps.
