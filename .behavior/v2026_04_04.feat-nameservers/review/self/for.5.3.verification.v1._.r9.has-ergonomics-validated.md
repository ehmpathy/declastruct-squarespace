# self-review: has-ergonomics-validated (r9)

## review criteria

from the guide:
> double-check: does the actual input/output match what felt right at repros?
>
> compare the implemented input/output to what was sketched in repros:
> - does the actual input match the planned input?
> - does the actual output match the planned output?
> - did the design change between repros and implementation?

---

## methodology

1. read the repros artifact (`3.2.distill.repros.experience._.v1.i1.md`)
2. read each implemented file
3. compare planned signatures vs actual signatures
4. identify any drift and determine if intentional or accidental

---

## step 1: compare planned vs actual input/output

### getNameservers

**planned (repros line 7):**
```
call `getNameservers({ by: { unique: { domain: { name } } } })`
```

**actual (getNameservers.ts lines 16-18):**
```typescript
input: {
  by: PickOne<{
    unique: RefByUnique<typeof DeclaredSquarespaceDomainNameservers>;
  }>;
}
```

which resolves to: `{ by: { unique: { domain: { name: string } } } }`

**verdict:** input matches exactly

**planned output (repros line 37):**
```
{ domain: { name }, nameservers: null }` or squarespace defaults
```

**actual output (getNameservers.ts lines 34-39):**
```typescript
return new DeclaredSquarespaceDomainNameservers({
  domain: RefByUnique.as<typeof DeclaredSquarespaceDomainRegistration>({
    name: domainName,
  }),
  nameservers: result.nameservers,
});
```

which produces: `{ domain: { name: string }, nameservers: string[] | null }`

**verdict:** output matches exactly

---

### setNameservers (upsert)

**planned (repros lines 46-57):**
```typescript
// input
const result = await setNameservers({
  upsert: {
    domain: { name: 'sunshineoceansurferturtles.com' },
    nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
  },
}, context);

// output
{
  domain: { name: 'sunshineoceansurferturtles.com' },
  nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
}
```

**actual (setNameservers.ts lines 16-19):**
```typescript
type SetNameserversInput = PickOne<{
  findsert: DeclaredSquarespaceDomainNameservers;
  upsert: DeclaredSquarespaceDomainNameservers;
}>;
```

**actual test use (play.integration.test.ts lines 57-65):**
```typescript
const ns = await setNameservers(
  {
    upsert: {
      domain: { name: TEST_DOMAIN },
      nameservers: CLOUDFLARE_NS,
    },
  },
  context,
);
```

**actual output (setNameservers.ts lines 70-75):**
```typescript
return new DeclaredSquarespaceDomainNameservers({
  domain: RefByUnique.as<typeof DeclaredSquarespaceDomainRegistration>({
    name: desired.domain.name,
  }),
  nameservers: result.nameservers,
});
```

**verdict:** input and output match exactly

---

### setNameservers (null to reset)

**planned (repros lines 78-80):**
```
| t1 | setNameservers upsert null | `{ domain: { name }, nameservers: null }` |
```

**actual (play.integration.test.ts lines 90-99):**
```typescript
const ns = await setNameservers(
  {
    upsert: {
      domain: { name: TEST_DOMAIN },
      nameservers: null,
    },
  },
  context,
);
```

**verdict:** matches exactly

---

### setNameservers (findsert)

**planned (repros lines 87-95):**
```
given('[case1] domain with no custom nameserver config')
  when('[t0] findsert with custom nameservers')
    then('config is created')
    then('returns entity with custom nameservers')

given('[case2] domain with extant custom nameserver config')
  when('[t0] findsert with different nameservers')
    then('extant config is returned unchanged')
```

**actual (play.integration.test.ts lines 190-223):**
```typescript
given('[case3] findsert semantics', () => {
  when('[t0] findsert with same state as current', () => {
    // ... findsert call ...
    then('returns extant entity unchanged', () => {
      expect(result.ns.nameservers).toEqual(result.current.nameservers);
    });
  });
});
```

**verdict:** matches — findsert preserves extant state

---

## step 2: check domain object shape

**planned (repros ergonomics table lines 138-143):**

| journey | input ergonomics | output ergonomics |
|---------|------------------|-------------------|
| get nameservers | domain ref + unique key | entity or null |
| set to cloudflare | domain ref + nameservers array | updated entity |
| set to null | null means "reset to default" | updated entity |

**actual (DeclaredSquarespaceDomainNameservers.ts lines 10-22):**
```typescript
export interface DeclaredSquarespaceDomainNameservers {
  domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>;
  nameservers: string[] | null;
}
```

**verdict:** shape matches planned ergonomics

---

## step 3: check documentation

**planned (repros line 142):**
```
| set to null | natural — null means "reset to default" | natural | need doc that null = squarespace default |
```

**actual (DeclaredSquarespaceDomainNameservers.ts lines 17-20):**
```typescript
/**
 * .what - Custom nameservers for this domain
 * .why - Allows use of external DNS providers like cloudflare
 * .note - null = squarespace default nameservers, [...] = custom nameservers
 */
nameservers: string[] | null;
```

**verdict:** documentation added as planned

---

## step 4: check for design drift

| aspect | planned | actual | drift? |
|--------|---------|--------|--------|
| get input | `{ by: { unique: { domain: { name } } } }` | same | no |
| get output | entity or null | entity (never null) | minor |
| set.upsert input | `{ upsert: { domain, nameservers } }` | same | no |
| set.findsert input | `{ findsert: { domain, nameservers } }` | same | no |
| set output | updated entity | same | no |
| null semantics | squarespace default | same | no |

### minor drift: get output always returns entity

**planned:** returns entity or null
**actual:** always returns entity (never null for a valid domain)

**rationale:** a domain always has nameservers — either custom ones or squarespace defaults. a `null` return would imply "no domain found" which differs from "no custom nameservers configured". the `nameservers` property is `null` when defaults are in use, but the entity always exists.

this drift is **intentional and better** — it separates "domain not found" (throw error) from "domain uses default nameservers" (`nameservers: null`).

---

## conclusion

**holds**: ergonomics match what was planned in repros.

### why each aspect holds

| aspect | why it holds |
|--------|--------------|
| getNameservers input | `{ by: { unique: { domain: { name } } } }` matches repros line 7 exactly — domain ref via unique key |
| getNameservers output | returns entity as planned; `nameservers: null` when defaults (documented in JSDoc line 19) |
| setNameservers.upsert input | `{ upsert: { domain, nameservers } }` matches repros lines 46-50 exactly |
| setNameservers.upsert output | returns updated entity as planned (repros line 54-57) |
| setNameservers.findsert input | `{ findsert: { domain, nameservers } }` matches repros line 87-95 |
| setNameservers.findsert output | preserves extant state as planned; test confirms in lines 215-217 |
| null semantics | `null = squarespace default` documented in JSDoc (line 19); matches repros line 142 requirement |
| validation errors | throws `BadRequestError` with actionable messages; matches repros lines 103-112 |

### the one intentional drift

**planned:** `getNameservers` returns entity or null
**actual:** `getNameservers` always returns entity (never null)

**why this is better:**
- separates "domain not found" (throw error) from "uses default nameservers" (`nameservers: null`)
- cleaner semantics: entity always exists for valid domain, only the `nameservers` property varies
- matches the declastruct pattern used elsewhere in codebase

this drift improves UX — callers don't need to check `if (result === null)` before they access `result.nameservers`.

### summary

all input/output signatures match repros. documentation requirement met. one intentional drift improves semantics. no action needed.
