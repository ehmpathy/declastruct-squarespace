# self-review: has-pruned-backcompat (r2)

## deeper reflection

in r1, I concluded too quickly. let me slow down and look with fresh eyes.

---

## the real question

> "for each backwards-compat concern in the code, did the wisher explicitly request it?"

this is not about whether backcompat EXISTS, but whether any code we wrote has backcompat INTENT that wasn't requested.

---

## re-examination

### concern 1: empty array normalization

**the code**:
```typescript
// in validateNameserversInput.ts
if (input.length === 0) return { normalized: null };
```

**the question**: is this backcompat, or requested behavior?

**let me trace the origin**:
1. wish.md: silent on empty array
2. vision.md: "empty array `[]` treated as `null` (squarespace default)"
3. criteria blackbox: "empty array treated as null (no error)"

**conclusion**: this is EXPLICITLY REQUESTED in vision and criteria. it's not backcompat, it's specification.

**why it holds**: the vision anticipated this edge case and prescribed the behavior. the wisher thought ahead.

---

### concern 2: the null semantics

**the code**:
```typescript
// in DeclaredSquarespaceDomainNameservers.ts
nameservers: string[] | null;
```

**the question**: why `null` and not `undefined` or `'default'`?

**let me trace the origin**:
1. vision.md: "null = squarespace default nameservers"
2. vision.md: "nameservers: [...] = custom nameservers (user-specified)"

**could this be backcompat in disguise?**:
- no - the feature is new
- `null` vs `'default'` is a design choice, not compatibility

**why it holds**: `null` is the prescribed representation for "squarespace manages this." it's not a legacy concern.

---

### concern 3: the DAO set.delete = null

**the code**:
```typescript
// in DeclaredSquarespaceDomainNameserversDao.ts
set: {
  findsert: ...,
  upsert: ...,
  delete: null, // explicitly not supported
}
```

**the question**: is the delete block a backcompat concern?

**let me trace the origin**:
1. vision.md: "nameserver config cannot be deleted, only reset to null"
2. blueprint.md: "set.delete is null (not supported)"

**could this be defensive backcompat?**:
- no - it's intentional business logic
- delete of nameservers is not a valid domain operation
- you can only reset to squarespace default (set to null)

**why it holds**: the domain model doesn't support deletion. this is by design, not by constraint.

---

### concern 4: validation min/max bounds

**the code**:
```typescript
// in validateNameserversInput.ts
if (nameservers.length < 2) throw BadRequestError...
if (nameservers.length > 13) throw BadRequestError...
```

**the question**: are these bounds for backcompat?

**let me trace the origin**:
1. vision.md: "minimum 2 nameservers required"
2. blueprint.md: "maximum 13 nameservers (RFC 1035 limit)"
3. criteria.md: "minimum 2 nameservers" in validation edgecases

**could looser bounds be backcompat?**:
- no - we're strict, not loose
- looser bounds would be backcompat
- strict bounds are correctness

**why it holds**: RFC 1035 and squarespace both require valid nameserver counts. strictness is correctness.

---

### concern 5: FQDN regex pattern

**the code**:
```typescript
const FQDN_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
```

**the question**: is this pattern permissive for backcompat?

**investigation**:
- the pattern validates standard FQDN format
- no special cases for legacy formats
- no "loose mode"

**why it holds**: the regex is strict and standard. no backcompat considerations.

---

## the synthesis

I found 0 backcompat code in the implementation:

| concern | type | verdict |
|---------|------|---------|
| empty array → null | requested behavior | not backcompat |
| null semantics | design choice | not backcompat |
| delete = null | business logic | not backcompat |
| validation bounds | correctness | not backcompat |
| FQDN regex | strictness | not backcompat |

---

## why this feature has no backcompat

### reason 1: the feature is new

there is no prior:
- implementation to be compatible with
- callers to avoid break
- data to migrate

### reason 2: all behavior was prescribed

every edge case was anticipated:
- empty array → null (vision)
- min 2 nameservers (vision, criteria)
- max 13 nameservers (blueprint)
- FQDN validation (vision, criteria)
- delete = null (vision, blueprint)

### reason 3: no defensive additions

I checked for:
- "just in case" loose validation → absent
- fallback patterns → absent
- deprecated field support → absent
- version migration code → absent

---

## what I learned

### lesson: trace every concern to the wish

when I slow down and trace each potential backcompat concern to the wish/vision/criteria, I can clearly distinguish:
- requested behavior (vision said so)
- correctness (RFC/domain says so)
- backcompat (legacy says so)

the nameservers feature has the first two, not the third.

### lesson: new features don't need backcompat

this seems obvious, but it's worth the articulation: backwards compatibility only matters when there's a "backwards" to be compatible with. new features start fresh.

---

## conclusion

backcompat review passes:
- 5 concerns traced to origin
- each concern is either requested behavior or correctness
- 0 backcompat code found
- the feature is new, so no legacy to support
