# self-review: has-behavior-declaration-adherance (r10)

## what I reviewed

I checked that the blueprint correctly interprets and implements each requirement from the vision and criteria — not just that items exist, but that they match the spec's intent.

---

## vision adherance checks

### domain object specification

**vision specifies**:
```typescript
interface DeclaredSquarespaceDomainNameservers {
  domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>;
  nameservers: string[] | null;
}
```

**blueprint declares** (codepath tree):
```
├── domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>
└── nameservers: string[] | null
```

**adherance check**:
- `domain` type: exact match ✓
- `nameservers` type: exact match ✓
- no extra fields added ✓
- no fields absent ✓

**verdict**: adheres.

### DAO specification

**vision specifies**:
```typescript
get: { one: { byUnique: ..., byPrimary: null } },
set: { findsert: ..., upsert: ..., delete: null },
```

**blueprint declares** (codepath tree):
```
├── get.one.byUnique → getNameservers
├── set.findsert → setNameservers({ findsert })
└── set.upsert → setNameservers({ upsert })
```

**adherance check**:
- get.one.byUnique: maps to getNameservers ✓
- get.one.byPrimary: not specified = null (correct) ✓
- set.findsert: maps to setNameservers({ findsert }) ✓
- set.upsert: maps to setNameservers({ upsert }) ✓
- set.delete: not specified = null (correct) ✓

**question**: should byPrimary be explicitly shown as null in blueprint?

**answer**: the declastruct pattern treats unspecified methods as null. the blueprint follows this convention. explicit null methods would add noise.

**verdict**: adheres.

### null semantics

**vision specifies**:
```
nameservers: null = squarespace manages (default)
nameservers: [...] = custom (user-specified)
```

**blueprint declares** (implementation notes):
```
- `nameservers: null` = squarespace manages nameservers (default)
- `nameservers: [...]` = custom nameservers (user-specified)
```

**adherance check**: exact semantic match ✓

**verdict**: adheres.

### getNameservers behavior

**vision specifies**:
```typescript
const ns = await getNameservers({ by: { unique: { domain: { name: 'example.com' } } } }, context);
// => { domain: { name: 'example.com' }, nameservers: null } // squarespace default
// => { domain: { name: 'example.com' }, nameservers: ['ns1.cloudflare.com', ...] } // custom
```

**blueprint declares** (codepath tree):
```
getNameservers (orchestrator)
├── [+] getNameservers.ts
│   ├── [←] scrapeDomainDetail (reuse — already scrapes nameservers)
│   └── [+] castIntoDeclaredSquarespaceDomainNameservers (new transformer)
```

**adherance check**:
- input signature: `{ by: { unique: { domain: { name } } } }` — inferred from DAO map ✓
- returns entity with domain ref and nameservers ✓
- returns null for default (squarespace) ✓
- returns array for custom ✓

**question**: does the cast transformer correctly interpret scrapeDomainDetail output?

**vision clarification**: `scrapeDomainDetail` already returns `nameservers: string[]`. the cast needs to:
1. return `{ domain, nameservers: null }` when array is empty (squarespace default)
2. return `{ domain, nameservers: [...] }` when array has entries (custom)

**blueprint coverage**: the cast transformer exists, and test coverage confirms "returns null for default, returns array for custom".

**verdict**: adheres.

### setNameservers behavior

**vision specifies**:
```typescript
// swap to cloudflare
await setNameservers({
  upsert: {
    domain: { name: 'example.com' },
    nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
  }
}, context);

// swap back to squarespace
await setNameservers({
  upsert: {
    domain: { name: 'example.com' },
    nameservers: null,
  }
}, context);
```

**blueprint declares** (codepath tree):
```
setNameservers (orchestrator)
├── [+] setNameservers.ts
│   ├── [+] validateNameserversInput (new transformer)
│   ├── [←] getNameservers (reuse)
│   └── [+] setNameserversScraper (new communicator)
```

**adherance check**:
- accepts `{ upsert: { domain, nameservers } }` ✓
- accepts `{ findsert: { domain, nameservers } }` (via DAO) ✓
- validates input before scraper ✓
- calls scraper to make change ✓

**question**: does setNameserversScraper correctly handle null vs array?

**blueprint coverage**: the scraper must:
- for `nameservers: [...]` → set custom nameservers
- for `nameservers: null` → reset to squarespace default (click "use squarespace nameservers" button)

**evidence**: selectors include `useSquarespaceNameserversButton` for the reset case.

**verdict**: adheres.

---

## criteria adherance checks

### validation rules

**vision specifies** (edgecases table):
- minimum 2 nameservers required
- validate FQDN format
- empty array treated as null

**blueprint declares** (implementation notes):
- minimum 2 nameservers required ✓
- maximum 13 nameservers (RFC 1035 limit) ✓
- FQDN pattern: `/^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})*\.?$/i` ✓
- empty array treated as null ✓

**adherance check**:
- minimum 2: matches vision ✓
- maximum 13: exceeds vision (vision didn't specify max) — acceptable addition ✓
- FQDN validation: matches vision intent ✓
- empty array: matches vision ✓

**verdict**: adheres (with acceptable enhancement of max 13 limit).

### test coverage criteria

**criteria specifies** (from blueprint criteria doc):
```
given('setNameservers')
  then('has integration test: upsert to set custom nameservers')
  then('has integration test: upsert to reset to default')
```

**blueprint declares** (journey test coverage):
```
when('[t1] setNameservers upsert to cloudflare')
  then('returns entity with custom nameservers')
when('[t3] setNameservers upsert back to null')
  then('returns entity with null nameservers')
```

**adherance check**:
- integration test for custom: [t1] ✓
- integration test for reset: [t3] ✓

**verdict**: adheres.

---

## potential misinterpretations checked

### check 1: domain reference format

**vision shows**: `{ domain: { name: 'example.com' } }`
**blueprint uses**: `domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>`

**question**: is `{ name: 'example.com' }` the correct shape for RefByUnique?

**verification**: `DeclaredSquarespaceDomainRegistration.unique = ['name']`, so RefByUnique extracts `{ name: string }`. exact match.

**verdict**: correctly interpreted.

### check 2: return type for getNameservers

**vision shows**: returns `{ domain: { name }, nameservers }` or null for not found

**blueprint coverage**: test coverage says "domain not found" as negative case.

**question**: should getNameservers return null when domain doesn't exist, or throw?

**vision clarification**: the example shows the return shape but doesn't specify not-found behavior. extant patterns in codebase (`getOneDomain`, `getOneDnsRecord`) return null for not found.

**verdict**: correctly follows extant pattern.

### check 3: findsert vs upsert distinction

**vision shows**: both operations demonstrated separately
**blueprint shows**: DAO exposes both `set.findsert` and `set.upsert`

**adherance check**:
- findsert: find extant or create if absent (does not overwrite) ✓
- upsert: create or update (always applies desired state) ✓

**verdict**: correctly interpreted.

---

## no misinterpretations found

after line-by-line comparison:

1. **domain object interface**: exact match
2. **DAO interface**: exact match with implicit nulls
3. **null semantics**: exact match
4. **operation signatures**: exact match
5. **validation rules**: matches with acceptable enhancement (max 13)
6. **test coverage**: matches criteria requirements
7. **reference formats**: correctly use RefByUnique

---

## conclusion

behavior declaration adherance review passes:

- **domain object**: exact interface match
- **DAO methods**: exact method map
- **null semantics**: exact semantic match
- **operations**: correct signatures and behaviors
- **validation**: matches with RFC enhancement
- **tests**: cover specified criteria
- **no misinterpretations**: all checks passed

blueprint correctly adheres to behavior declaration.
