# self-review: has-no-silent-scope-creep (r4)

## review approach

read actual implementation code. compare against blueprint codepaths. look for features not in blueprint.

---

## code-level scope creep check

### setNameservers.ts

**blueprint codepath tree:**
```
setNameservers (orchestrator)
├── [+] setNameservers.ts
│   ├── [+] validateNameserversInput (new transformer)
│   ├── [←] getNameservers (reuse)
│   ├── [←] getNewLoggedInBrowserPage (reuse)
│   └── [+] setNameserversScraper (new communicator)
```

**actual implementation:**
- line 34-36: validateNameserversInput — matches blueprint
- line 97-100: getNameservers — matches blueprint
- line 112-118: withNewLoggedInBrowserPage — matches blueprint
- line 54-59: setNameserversScraper — matches blueprint

**additional behavior found:**

| behavior | lines | scope creep? | reason |
|----------|-------|--------------|--------|
| idempotency check | 38-51, 102-109 | no | required by blackbox criteria |
| early return for findsert | 44-46, 103-108 | no | required by findsert semantics |
| error throw | 61-67 | no | standard pattern |

**why idempotency is not scope creep:**

blackbox criteria (2.1.criteria.blackbox.md) explicitly requires:
```
then('operation is idempotent')
  sothat('repeat calls produce same result')
```

the idempotency check at lines 38-51 and 102-109 implements this requirement. not scope creep — it's declared criteria.

**why error throw is not scope creep:**

error throw is a standard pattern for all operations. the blueprint doesn't need to declare "throw error if fails" because that's implicit in every operation.

---

### DeclaredSquarespaceDomainNameserversDao.ts

**blueprint criteria:**
```
given('DeclaredSquarespaceDomainNameserversDao')
  then('created via genDeclastructDao')
  then('exposes: get.one.byUnique')
  then('exposes: set.findsert')
  then('exposes: set.upsert')
  then('set.delete is null (not supported)')
```

**actual implementation:**
- line 12: genDeclastructDao — matches blueprint
- line 19-20: get.one.byUnique — matches blueprint
- line 21: get.one.byPrimary: null — correct (no primary key)
- line 29-30: set.findsert — matches blueprint
- line 35-36: set.upsert — matches blueprint
- line 41: set.delete: null — matches blueprint

**scope creep found:** none. DAO matches blueprint exactly.

---

### getNameservers.ts

**blueprint codepath tree:**
```
getNameservers (orchestrator)
├── [+] getNameservers.ts
│   ├── [←] getNewLoggedInBrowserPage (reuse)
│   ├── [←] scrapeDomainDetail (reuse — already scrapes nameservers)
│   └── [+] castIntoDeclaredSquarespaceDomainNameservers (new transformer)
```

note: blueprint assumed scrapeDomainDetail reuse, but implementation uses getNameserversScraper (documented divergence).

**actual implementation:**
- withNewLoggedInBrowserPage — matches (via wrapper pattern)
- getNameserversScraper — documented divergence (instead of scrapeDomainDetail)
- castIntoDeclaredSquarespaceDomainNameservers — matches blueprint

**scope creep found:** none beyond documented divergence.

---

### validateNameserversInput.ts

**blueprint test coverage:**
```
validateNameserversInput.test.ts | min 2, max 13, FQDN format, empty to null
```

**actual validation rules:**
- min 2 nameservers — matches blueprint
- max 13 nameservers — matches blueprint
- FQDN format check — matches blueprint
- empty array to null — matches blueprint

**scope creep found:** none. validation rules match blueprint exactly.

---

### setNameserversScraper.ts

**blueprint codepath tree:**
```
setNameserversScraper (communicator)
├── [+] setNameserversScraper.ts
│   ├── [←] navigateAndAssertUrl (reuse)
│   ├── [←] waitForSquarespaceReactRender (reuse)
│   ├── [←] handleReauthentication (reuse)
│   ├── [+] handle confirmation dialogs
│   └── [+] verify nameserver change
```

**actual implementation:**
- waitForSquarespaceReactRender — matches blueprint
- handleReauthentication — matches blueprint
- confirmation dialogs — matches blueprint ("handle confirmation dialogs")
- verification — matches blueprint ("verify nameserver change")

**scope creep found:** none.

---

## skeptic's challenge

**"did you add any features not in the blueprint?"**

| candidate | in blueprint? | location |
|-----------|--------------|----------|
| idempotency check | yes | blackbox criteria 2.1 |
| early return optimization | yes | findsert semantics |
| error throw | implicit | standard pattern |
| JSDoc comments | implicit | code quality |
| button visibility null detection | documented divergence | r3.has-divergence-addressed |

**verdict:** no undocumented features added.

---

**"did you change things 'while you were in there'?"**

the only modifications to extant files:
- domainDetailSelectors.ts — new selectors for nameservers feature
- (renewal selectors also present but from separate behavior route)

**verdict:** no opportunistic refactors. changes are scoped to nameservers feature.

---

**"did you refactor code unrelated to the wish?"**

search for changes outside domainNameservers directory:

| file | change | related to nameservers? |
|------|--------|------------------------|
| domainDetailSelectors.ts | new selectors | yes, required for feature |
| DeclaredSquarespaceDomainNameserversDao.ts | new file | yes, blueprint declared |
| DeclaredSquarespaceDomainNameservers.ts | new file | yes, blueprint declared |

**verdict:** no unrelated refactors.

---

## issues found

none. implementation matches blueprint + blackbox criteria + documented divergences. no silent scope creep.

---

## why it holds

1. **idempotency is criteria, not scope creep**: blackbox criteria explicitly requires idempotent operations
2. **DAO matches blueprint exactly**: every method declared in criteria is present, no extra methods
3. **validation rules match blueprint**: min 2, max 13, FQDN format, empty to null — all from test coverage section
4. **no opportunistic refactors**: only nameservers-related changes in nameservers-related files
5. **error throw is implicit**: every operation handles failures, doesn't need explicit declaration

the implementation contains exactly what was declared plus standard implicit behaviors (error throw, JSDoc). no features were added beyond blueprint + criteria + documented divergences.

