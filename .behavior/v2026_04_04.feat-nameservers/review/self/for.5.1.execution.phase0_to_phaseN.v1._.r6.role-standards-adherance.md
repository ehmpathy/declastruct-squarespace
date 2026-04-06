# self-review: role-standards-adherance (r6)

## rule directories checked

- lang.terms/ — noun_adj order, treestruct, ubiqlang, gerunds, forbid terms
- lang.tones/ — lowercase, seaturtle identity, chill emojis
- code.prod/evolvable.procedures/ — arrow functions, input-context pattern, single responsibility, hook wrapper
- code.prod/evolvable.domain.objects/ — domain object patterns, ref requirements
- code.prod/pitofsuccess.errors/ — failfast, failloud, forbid failhide
- code.prod/readable.narrative/ — no else branches, code paragraphs, narrative flow
- code.prod/readable.comments/ — .what/.why headers
- code.test/frames.behavior/ — given/when/then BDD pattern

---

## files reviewed

### DeclaredSquarespaceDomainNameservers.ts

| rule | status | evidence |
|------|--------|----------|
| extends DomainEntity | pass | line 24 |
| RefByUnique for domain ref | pass | line 14 |
| JSDoc .what/.why | pass | lines 5-9 |
| lowercase comments | pass | all comments lowercase |
| no gerunds | pass | no -ing nouns |

---

### getNameservers.ts

| rule | status | evidence |
|------|--------|----------|
| (input, context) pattern | pass | line 14-21 |
| arrow functions | pass | const = async pattern throughout |
| JSDoc .what/.why | pass | lines 10-13, 42-45 |
| get verb prefix | pass | getNameservers |
| RefByUnique construction | pass | lines 35-37 |
| hook wrapper pattern | pass | withNewLoggedInBrowserPage at line 46 |
| code paragraph comments | pass | lines 24, 27, 33 |

---

### setNameservers.ts

| rule | status | evidence |
|------|--------|----------|
| (input, context) pattern | pass | lines 24-27, 80-83 |
| arrow functions | pass | const = async pattern |
| JSDoc .what/.why | pass | lines 20-23, 75-79, 120-123 |
| set verb prefix | pass | setNameservers |
| failfast | pass | UnexpectedCodePathError.throw at line 88 |
| hook wrapper pattern | pass | withNewLoggedInBrowserPage at line 109 |
| code paragraph comments | pass | lines 32, 37, 42, 47, 52, etc. |

**ISSUE FOUND — bag ref blocker**

line 69-72:
```typescript
return new DeclaredSquarespaceDomainNameservers({
  domain: { name: desired.domain.name },  // bag ref
  nameservers: result.nameservers,
});
```

**violation**: rule.forbid.dobj.bagrefs — untyped inline object literal for domain reference

**fix required**: use RefByUnique.as<...>

---

### validateNameserversInput.ts

| rule | status | evidence |
|------|--------|----------|
| arrow function | pass | line 20 |
| JSDoc .what/.why | pass | lines 9-19 |
| failfast validation | pass | BadRequestError at lines 31, 39, 48 |
| no else branches | pass | uses early returns |
| lowercase comments | pass | all comments lowercase |

---

### DeclaredSquarespaceDomainNameserversDao.ts

| rule | status | evidence |
|------|--------|----------|
| JSDoc .what/.why | pass | lines 8-11, 25-28, 31-34, 37-40 |
| genDeclastructDao pattern | pass | line 12 |

---

### getNameserversScraper.ts

| rule | status | evidence |
|------|--------|----------|
| (input) pattern | pass | line 13 |
| arrow function | pass | line 13 |
| JSDoc .what/.why/.note | pass | lines 8-12 |
| code paragraph comments | pass | lines 22, 27, 37, 47, 54 |
| no else branches | pass | uses early return at line 48 |

---

### setNameserversScraper.ts

| rule | status | evidence |
|------|--------|----------|
| (input) pattern | pass | line 15 |
| arrow function | pass | line 15 |
| JSDoc .what/.why/.note | pass | lines 10-14 |
| code paragraph comments | pass | lines 27, 33, 43, 59, 89, etc. |

**ISSUE FOUND — else branch**

line 88:
```typescript
} else {
```

**violation**: rule.forbid.else-branches — else branches are forbidden, use early returns

**analysis**: the null case (reset to squarespace) at lines 44-87 could return early after its verification, which eliminates the else branch for custom nameservers at lines 88-168

**fix required**: refactor to early return pattern

---

### test files

| file | BDD pattern | status |
|------|-------------|--------|
| DeclaredSquarespaceDomainNameservers.test.ts | given/when/then | pass |
| validateNameserversInput.test.ts | given/when/then | pass |
| setNameservers.play.integration.test.ts | given/when/then + useBeforeAll | pass |

all test files use test-fns BDD pattern correctly.

---

## issues summary

| issue | file | line | severity | status |
|-------|------|------|----------|--------|
| bag ref | setNameservers.ts | 69-72 | blocker | to fix |
| else branch | setNameserversScraper.ts | 88 | blocker | to fix |

---

## fixes applied

### fix 1: bag ref in setNameservers.ts

**before** (line 69-72):
```typescript
return new DeclaredSquarespaceDomainNameservers({
  domain: { name: desired.domain.name },
  nameservers: result.nameservers,
});
```

**after**:
```typescript
return new DeclaredSquarespaceDomainNameservers({
  domain: RefByUnique.as<typeof DeclaredSquarespaceDomainRegistration>({
    name: desired.domain.name,
  }),
  nameservers: result.nameservers,
});
```

**why**: rule.forbid.dobj.bagrefs requires typed refs for domain object construction

---

### fix 2: else branch in setNameserversScraper.ts

**approach**: refactor if/else to early return pattern

the null case (reset to squarespace) handles its own verification and can return early. this eliminates the else branch for custom nameservers.

**why**: rule.forbid.else-branches requires early returns instead of else

---

## conclusion

two blockers found and fixed:
1. bag ref violation in setNameservers.ts — fixed with RefByUnique.as<...>
2. else branch in setNameserversScraper.ts — refactored to early return

all other mechanic standards are satisfied.
