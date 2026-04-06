# self-review: has-pruned-backcompat (r6)

## what I reviewed

I challenged my r5 conclusion that "new feature = no backwards-compat concerns." I asked: what if that's too easy? what hidden constraints exist?

---

## the question I asked

> "what backwards-compat constraints does this blueprint inherit from extant code, even though the feature is new?"

---

## deeper investigation

### constraint 1: extant domain object patterns

**the relationship**: `DeclaredSquarespaceDomainNameservers` follows patterns from `DeclaredSquarespaceDomainDnsRecord` and `DeclaredSquarespaceDomainRegistration`.

**question**: are we constrained by how these extant objects were designed?

**investigation**:
- extant objects use `RefByUnique<typeof DeclaredSquarespaceDomainRegistration>` for domain references
- blueprint uses same pattern
- this is consistency, not backwards-compat

**why it's not backwards-compat**: we're not maintaining compatibility with an old version of `DeclaredSquarespaceDomainNameservers`. we're following an extant pattern for new code.

**key distinction**: pattern conformance ≠ backwards-compat. pattern conformance is "how we write new code." backwards-compat is "how we support old code."

---

### constraint 2: extant utility dependencies

**the relationship**: blueprint reuses `getNewLoggedInBrowserPage`, `waitForSquarespaceReactRender`, etc.

**question**: are we constrained by what these utilities support?

**investigation**:
- these utilities are generic browser operations
- they don't know about nameservers
- we call them; they don't call us

**why it's not backwards-compat**: we consume these utilities. we don't maintain them. if they changed, we'd adapt — that's forward evolution, not backwards-compat.

---

### constraint 3: extant selector file structure

**the relationship**: blueprint updates `domainDetailSelectors.ts` rather than creating a new file.

**question**: are we constrained by the extant selector organization?

**investigation**:
- `domainDetailSelectors.ts` is a flat object of selectors
- adding new selectors is additive
- no extant code depends on the selector count or shape

**why it's not backwards-compat**: adding properties to a selector object is pure addition. we're not maintaining compatibility with consumers of selectors — we ARE the consumers.

---

### constraint 4: extant DAO patterns

**the relationship**: blueprint creates DAO via `genDeclastructDao`, same pattern as `DeclaredSquarespaceDomainDnsRecordDao`.

**question**: are we constrained by how extant DAOs were structured?

**investigation**:
- `genDeclastructDao` is a generic factory
- each DAO is independent
- no cross-DAO dependencies

**why it's not backwards-compat**: we're using a pattern, not maintaining compatibility with extant DAOs. our DAO doesn't need to work with code that expected an older version of it (because there is no older version).

---

### constraint 5: extant test patterns

**the relationship**: blueprint follows BDD test patterns from `setDomain.integration.test.ts`.

**question**: are we constrained to write tests in a specific way for compatibility?

**investigation**:
- test patterns are style conventions
- tests don't have callers
- changing test style doesn't break production code

**why it's not backwards-compat**: test patterns are internal quality practices, not external contracts. no code depends on how our tests are structured.

---

## what I actually found

### the real constraint: genDeclastructDao contract

**discovery**: the ONE actual constraint is `genDeclastructDao`'s expected interface.

**the interface**:
```typescript
genDeclastructDao<DObj, Context>({
  dobj: DObj,
  get: {
    one: {
      byUnique: (input, context) => DObj | null,
      byPrimary: (input, context) => DObj | null,
    },
  },
  set: {
    findsert: (input, context) => DObj,
    upsert: (input, context) => DObj,
    delete: (input, context) => void,
  },
});
```

**is this backwards-compat?**: no — this is a contract we must satisfy to use the utility. it's like implementing an interface. we're not maintaining compatibility with an older version of our DAO; we're implementing a required interface for a new DAO.

**analogy**: implementing `Comparable` interface in Java isn't backwards-compat. it's interface conformance.

---

## why r5 was correct but shallow

r5 concluded "no backwards-compat" but didn't examine WHY deeply enough.

**r5 reasoning**: "this is a new feature, so no backwards-compat needed."

**r6 reasoning**: "even though we inherit constraints from extant patterns and utilities, these are:
1. pattern conformance (how we write new code)
2. interface implementation (contracts we satisfy)
3. utility consumption (we use, they don't call us)

none of these are backwards-compat because backwards-compat specifically means: maintaining compatibility with OLD VERSIONS of OUR code."

---

## the taxonomy I learned

| type | definition | example | is backwards-compat? |
|------|------------|---------|---------------------|
| pattern conformance | follow extant style | use RefByUnique like other objects | no |
| interface implementation | satisfy required contract | genDeclastructDao expects specific shape | no |
| utility consumption | call extant code | use waitForSquarespaceReactRender | no |
| backwards-compat | support old callers | maintain v1 API while adding v2 | YES |

**key insight**: backwards-compat requires the existence of OLD CALLERS of YOUR CODE. a new feature has no old callers.

---

## what I learned

### lesson 1: "new feature = no backwards-compat" is true but needs qualification

it's true BECAUSE new features have no old callers. not because "new = simple."

### lesson 2: inherited constraints have names

- pattern conformance
- interface implementation
- utility consumption

these are not backwards-compat. they're different types of coupling.

### lesson 3: backwards-compat is specifically about YOUR code's OLD versions

if there's no old version of your code, there's no backwards-compat concern — by definition.

---

## conclusion

backwards-compat review passes with deeper reasoning:
- 5 potential constraints examined
- 0 are backwards-compat (all are pattern conformance, interface implementation, or utility consumption)
- key insight: backwards-compat requires old callers of YOUR code
- new feature has no old callers
- r5 conclusion confirmed with rigorous analysis
