# self-review: has-pruned-backcompat (r1)

## what I reviewed

I examined the nameservers implementation for any backwards compatibility code that was not explicitly requested.

---

## the question I asked

> "did we add backwards compatibility shims, deprecated fields, or legacy support that wasn't requested?"

---

## backcompat suspects examined

### suspect 1: empty array to null normalization

**the audit**:
- `validateNameserversInput.ts` treats `[]` (empty array) the same as `null`
- this means callers can pass either for "squarespace default"

**why I thought it might be unneeded backcompat**:
- could be "defensive" code
- could be "just in case" someone passes `[]`
- the contract clearly says `null` = squarespace default

**investigation**:
- vision explicitly says: "empty array `[]` treated as `null` (squarespace default)"
- blackbox criteria says: "empty array treated as null (squarespace default)"
- this is a REQUESTED behavior, not backwards compat

**verdict**: NOT BACKCOMPAT - explicitly requested in vision and criteria.

---

### suspect 2: domain object schema

**the audit**:
- `DeclaredSquarespaceDomainNameservers` has minimal fields:
  - `domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>`
  - `nameservers: string[] | null`

**why I thought it might have backcompat**:
- sometimes domain objects carry deprecated fields for old data
- sometimes objects have optional fields "for future use"

**investigation**:
- no deprecated fields
- no optional fields (both fields are required)
- no version field
- no migration shims

**verdict**: NOT BACKCOMPAT - clean schema, no legacy support.

---

### suspect 3: DAO delete method

**the audit**:
- `DeclaredSquarespaceDomainNameserversDao` has `set.delete = null`
- delete operation is explicitly not supported

**why I thought it might be backcompat concern**:
- some DAOs support delete for legacy reasons
- we explicitly block it here

**investigation**:
- blueprint says: "set.delete is null (not supported)"
- vision says: "nameserver config cannot be deleted, only reset to null"
- this is intentional design, not backcompat

**verdict**: NOT BACKCOMPAT - intentional limitation per vision.

---

### suspect 4: validation bounds

**the audit**:
- minimum 2 nameservers
- maximum 13 nameservers
- FQDN format validation

**why I thought it might be relaxed for backcompat**:
- sometimes validation is loose to accept legacy data
- RFC 1035 allows 1 nameserver (though rare)

**investigation**:
- min 2 is enforced (no loose mode)
- max 13 is enforced (no override)
- FQDN is strictly validated
- no "legacy mode" or "permissive mode"

**verdict**: NOT BACKCOMPAT - strict validation as specified.

---

### suspect 5: scraper selectors

**the audit**:
- `domainDetailSelectors.ts` has new selectors for nameservers page
- selectors are straightforward, no fallbacks

**why I thought it might have backcompat**:
- sometimes selectors have fallback patterns for old UI versions
- sometimes multiple selector paths for the same element

**investigation**:
- each selector is a single pattern
- no alternative selectors
- no comments about "old UI" or "deprecated"

**verdict**: NOT BACKCOMPAT - clean selectors, no fallbacks.

---

## what I actually found

### found: no backwards compatibility code

the nameservers feature has:
- no deprecated fields
- no legacy shims
- no version migrations
- no permissive validation modes
- no fallback selectors
- no "old API" support

this is expected - the feature is NEW, so there's no prior behavior to be backwards compatible with.

---

## why there's no backcompat

### the newness test

this is a NEW feature:
- no prior implementation exists
- no prior callers exist
- no prior data exists

backwards compatibility is only needed when:
1. prior implementation exists AND
2. prior callers depend on it AND
3. we want to avoid break them

none of these apply to the nameservers feature.

### the explicit request test

did the wisher request backwards compat?
- no mention of backwards compat in wish
- no mention in vision
- no mention in criteria

### the "just in case" test

did we add backcompat "just in case"?
- no - the empty array normalization was explicitly requested
- no - all behavior was prescribed

---

## what I learned

### lesson: new features don't need backcompat

the nameservers feature is new. there's no prior implementation, no prior callers, no prior data. backwards compatibility is irrelevant for new features.

### lesson: document why delete is null

the `set.delete = null` in the DAO might look like a limitation, but it's intentional - nameserver config can't be deleted, only reset. this is documented in the vision.

---

## conclusion

backcompat review passes:
- 5 suspects examined
- 0 backwards compat code found
- feature is new, so no backcompat needed
- all behavior matches vision/criteria
