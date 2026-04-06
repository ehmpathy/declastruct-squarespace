# self-review: has-pruned-backcompat (r5)

## what I reviewed

I examined the blueprint for backwards compatibility concerns that were added "to be safe" without explicit wisher request.

---

## the question I asked

> "what backwards-compat hacks are in this blueprint that nobody asked for?"

---

## backwards-compat audit

### this is a new feature

first observation: `DeclaredSquarespaceDomainNameservers` is a **new** entity. there is no prior version to be backwards-compatible with.

this review checks for:
1. backwards-compat with other entities in the repo
2. backwards-compat with external systems
3. "just in case" defensive code

---

### area 1: domain object design

**question**: did we add any backwards-compat to the domain object?

**audit**:
- `domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>` — references extant domain object
- `nameservers: string[] | null` — new property

**backwards-compat found**: none. this is a new entity.

**verdict**: clean.

---

### area 2: operation signatures

**question**: did we add optional parameters "for future flexibility" or "to match other signatures"?

**audit**:
- `getNameservers({ by: { unique: { domain: { name } } } })` — standard pattern
- `setNameservers({ upsert: ... })` — standard pattern
- `setNameservers({ findsert: ... })` — standard pattern

**backwards-compat found**: none. signatures follow extant patterns (this is consistency, not backwards-compat).

**verdict**: clean.

---

### area 3: empty array handle

**question**: is `[] treated as null` a backwards-compat hack?

**audit**: vision explicitly states: "empty array `[]` treated as `null` (squarespace default)."

**is this backwards-compat?**: no. this is forward design decision, not backwards-compat. it's ergonomic (callers can pass `[]` or `null`), not defensive.

**alternative**: we could reject `[]` with error. vision chose the ergonomic path.

**verdict**: NOT backwards-compat — explicit design choice in vision.

---

### area 4: null semantics for default nameservers

**question**: is `null = squarespace default` a backwards-compat hack?

**audit**: vision explicitly states: "`nameservers: null` = squarespace manages nameservers (default)"

**is this backwards-compat?**: no. this is domain model decision. alternatives:
- empty array for default: rejected (vision chose null)
- separate boolean field: rejected (null is simpler)
- no representation of default: rejected (we need to model the state)

**verdict**: NOT backwards-compat — explicit domain design in vision.

---

### area 5: selector updates vs new file

**question**: did we add backwards-compat by update to extant selectors file instead of new file?

**audit**: blueprint updates `domainDetailSelectors.ts` instead of new file.

**is this backwards-compat?**: no. this is **consistency** with extant pattern. all domain detail selectors live in one file.

**if we created a new file**: that would be inconsistent with repo structure.

**verdict**: NOT backwards-compat — consistency with extant structure.

---

### area 6: reuse of extant utilities

**question**: did we add backwards-compat shims to use extant utilities?

**audit**: blueprint reuses:
- `getNewLoggedInBrowserPage`
- `navigateAndAssertUrl`
- `waitForSquarespaceReactRender`
- `handleReauthentication`

**is this backwards-compat?**: no. these utilities already exist and work. no shims needed.

**if utilities didn't fit**: we would adapt them or create new ones. no adaptation needed.

**verdict**: NOT backwards-compat — direct reuse.

---

## what I actually found

### result: no backwards-compat concerns exist

this is a new feature. there is no prior version. the blueprint:
- does not maintain old API signatures
- does not add deprecation alerts
- does not add migration code
- does not add "v1/v2" versioned endpoints
- does not add optional parameters for "future callers"

the blueprint is clean of backwards-compat hacks.

---

## why backwards-compat is not a concern here

### this is a new entity

`DeclaredSquarespaceDomainNameservers` does not exist yet. there are no callers to be backwards-compatible with.

### vision does not mention backwards-compat

the vision does not say:
- "maintain compatibility with X"
- "support both old and new API"
- "deprecate but don't remove"

### declastruct pattern does not require backwards-compat

the pattern is:
1. create domain object
2. create DAO
3. create operations

no backwards-compat layer is part of this pattern.

---

## what I learned

### lesson 1: new features have no backwards-compat

backwards-compat reviews are most relevant for modifications to extant features. for new features, the review confirms: "we didn't add defensive code for callers that don't exist."

### lesson 2: consistency is not backwards-compat

I initially wondered if selector updates were backwards-compat. they're not — they're consistency with extant structure. the distinction:
- backwards-compat: "we have to support old way"
- consistency: "we follow extant pattern"

### lesson 3: ergonomic design is not backwards-compat

`[] treated as null` is ergonomic design, not backwards-compat. the distinction:
- backwards-compat: "we accept both because old callers use the old way"
- ergonomic design: "we accept both because either is intuitive"

---

## conclusion

backwards-compat review passes:
- 6 areas examined
- 0 backwards-compat hacks found
- 0 open questions for wisher
- this is a new feature with no prior version
- vision does not request backwards-compat
- blueprint is clean
