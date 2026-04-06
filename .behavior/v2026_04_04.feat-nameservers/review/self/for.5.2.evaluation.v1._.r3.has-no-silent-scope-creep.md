# self-review: has-no-silent-scope-creep (r3)

## review approach

compare actual implementation files against blueprint filediff tree. check for features added "while you were in there".

---

## file inventory

### blueprint declared (filediff tree)

| path | file |
|------|------|
| domain.objects/ | DeclaredSquarespaceDomainNameservers.ts |
| domain.objects/ | DeclaredSquarespaceDomainNameservers.test.ts |
| domain.operations/domainNameservers/ | castIntoDeclaredSquarespaceDomainNameservers.ts |
| domain.operations/domainNameservers/ | castIntoDeclaredSquarespaceDomainNameservers.test.ts |
| domain.operations/domainNameservers/ | getNameservers.ts |
| domain.operations/domainNameservers/ | getNameservers.test.ts |
| domain.operations/domainNameservers/ | getNameservers.integration.test.ts |
| domain.operations/domainNameservers/ | setNameservers.ts |
| domain.operations/domainNameservers/ | setNameservers.test.ts |
| domain.operations/domainNameservers/ | setNameservers.play.integration.test.ts |
| access/daos/ | DeclaredSquarespaceDomainNameserversDao.ts |
| access/daos/ | DeclaredSquarespaceDomainNameserversDao.integration.test.ts |
| access/sdks/.../domainNameservers/ | setNameserversScraper.ts |
| access/sdks/.../domainNameservers/ | setNameserversScraper.integration.test.ts |
| selectors/ | domainDetailSelectors.ts [~] |

total: 14 new files + 1 modified file

### documented divergences (additions)

| file | reason |
|------|--------|
| validateNameserversInput.ts | implied by codepath tree |
| validateNameserversInput.test.ts | implied by codepath tree |
| getNameserversScraper.ts | consequence of GET divergence |

total: 3 additional files

### actual implementation

| file | status |
|------|--------|
| DeclaredSquarespaceDomainNameservers.ts | matches blueprint |
| DeclaredSquarespaceDomainNameservers.test.ts | matches blueprint |
| castIntoDeclaredSquarespaceDomainNameservers.ts | matches blueprint |
| castIntoDeclaredSquarespaceDomainNameservers.test.ts | matches blueprint |
| getNameservers.ts | matches blueprint |
| getNameservers.test.ts | matches blueprint |
| getNameservers.integration.test.ts | matches blueprint |
| setNameservers.ts | matches blueprint |
| setNameservers.test.ts | matches blueprint |
| setNameservers.play.integration.test.ts | matches blueprint |
| DeclaredSquarespaceDomainNameserversDao.ts | matches blueprint |
| DeclaredSquarespaceDomainNameserversDao.integration.test.ts | matches blueprint |
| setNameserversScraper.ts | matches blueprint |
| setNameserversScraper.integration.test.ts | matches blueprint |
| validateNameserversInput.ts | documented divergence |
| validateNameserversInput.test.ts | documented divergence |
| getNameserversScraper.ts | documented divergence |

total: 17 files (14 blueprint + 3 documented divergences)

---

## selector changes review

### blueprint declared selectors

blueprint codepath tree:
```
domainDetailSelectors
├── [~] add nameserver page selectors
│   ├── nameserverSection
│   ├── customNameserverInputs
│   ├── saveNameserversButton
│   └── useSquarespaceNameserversButton
```

### actual selector additions

git diff shows these nameservers-related additions:
- nameserversSection (updated)
- nameserverRow (updated)
- nameserverValue (updated)
- editNameserversButton (updated)
- nameserverEditModal (new)
- customNameserverInputs (new)
- saveNameserversButton (new)
- useSquarespaceNameserversButton (new)
- resetNameserversConfirmModal (new)
- resetNameserversConfirmButton (new)

### selector scope creep check

the git diff also shows renewal-related selectors:
- renewalToggleInput
- renewalToggleLabel
- renewalConfirmButton
- renewalConfirmModal

**verdict on renewal selectors:** these belong to a separate feature (`.behavior/v2026_04_03.renewal-from-list/`). they are not scope creep from the nameservers feature — they were added by a different behavior route that happens to share the same file.

---

## features added "while you were in there"

| candidate | verdict | reason |
|-----------|---------|--------|
| resetNameserversConfirmModal | not scope creep | required for reset flow (set nameservers to null) |
| resetNameserversConfirmButton | not scope creep | required for reset flow confirmation |
| nameserverEditModal | not scope creep | required for set flow |

these selectors were not explicitly in the blueprint selector list but are required to implement the set functionality. the blueprint said "handle confirmation dialogs" which implies these selectors.

---

## issues found

none. all files match blueprint + documented divergences. no undocumented additions.

---

## why it holds

1. **file count matches**: 17 implementation files = 14 blueprint + 3 documented divergences
2. **no extra files**: every file is either in blueprint or documented as divergence
3. **selector additions are justified**: all added selectors support the declared functionality (get/set nameservers)
4. **renewal selectors are separate feature**: they belong to a different behavior route, not nameservers scope creep
5. **confirmation dialog selectors are implicit**: blueprint's "handle confirmation dialogs" requires these selectors

no silent scope creep detected. implementation matches blueprint + documented divergences exactly.

