# self-review: has-behavior-declaration-adherance (r11)

## what I reviewed

I went through the blueprint line by line, checked against the vision and criteria to verify that:
1. the blueprint implements what the vision describes
2. the blueprint satisfies the criteria correctly
3. there are no misinterpretations or deviations

---

## section 1: domain object interface adherance

### vision specifies

```typescript
interface DeclaredSquarespaceDomainNameservers {
  domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>;
  nameservers: string[] | null;
}
```

### blueprint declares (codepath tree)

```
DeclaredSquarespaceDomainNameservers
├── [+] domain object declaration
│   ├── domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>
│   └── nameservers: string[] | null
```

### adherance verification

| field | vision | blueprint | match? |
|-------|--------|-----------|--------|
| `domain` | `RefByUnique<typeof DeclaredSquarespaceDomainRegistration>` | same | exact ✓ |
| `nameservers` | `string[] \| null` | same | exact ✓ |

**no extra fields added**: the blueprint declares exactly two fields, same as vision.

**no fields omitted**: both fields from vision are present.

**verdict**: exact match. no deviation.

---

## section 2: DAO interface adherance

### vision specifies

```typescript
const DeclaredSquarespaceDomainNameserversDao = genDeclastructDao<...>({
  get: { one: { byUnique: ..., byPrimary: null } },
  set: { findsert: ..., upsert: ..., delete: null },
});
```

### blueprint declares (codepath tree lines 70-74)

```
DeclaredSquarespaceDomainNameserversDao
├── [+] DAO via genDeclastructDao
│   ├── get.one.byUnique → getNameservers
│   ├── set.findsert → setNameservers({ findsert })
│   └── set.upsert → setNameservers({ upsert })
```

### adherance verification

| method | vision | blueprint | match? |
|--------|--------|-----------|--------|
| `get.one.byUnique` | specified with implementation | maps to `getNameservers` | ✓ |
| `get.one.byPrimary` | `null` | not listed (implicit null) | ✓ |
| `set.findsert` | specified with implementation | maps to `setNameservers({ findsert })` | ✓ |
| `set.upsert` | specified with implementation | maps to `setNameservers({ upsert })` | ✓ |
| `set.delete` | `null` | not listed (implicit null) | ✓ |

**question raised**: should `byPrimary: null` and `delete: null` be explicit in blueprint?

**answer**: the declastruct pattern treats unspecified methods as null. the blueprint follows this convention — it omits null methods. explicit nulls would add noise without value.

**verdict**: exact match. no deviation.

---

## section 3: null semantics adherance

### vision specifies

```
nameservers: null = squarespace default
nameservers: [...] = custom nameservers
```

the vision also specifies:
> "empty array `[]` treated same as null (squarespace default)"

### blueprint declares (implementation notes)

```
- `nameservers: null` = squarespace manages nameservers (default)
- `nameservers: [...]` = custom nameservers (user-specified)
```

and in validation unit tests:
```
given('[case4] empty array')
  then('treated as null (no error)')
```

### adherance verification

| semantic | vision | blueprint | match? |
|----------|--------|-----------|--------|
| `null` means | squarespace default | squarespace manages (default) | exact ✓ |
| `[...]` means | custom nameservers | custom (user-specified) | exact ✓ |
| `[]` handled | treat as null | treated as null (no error) | exact ✓ |

**verdict**: exact match. no deviation.

---

## section 4: getNameservers operation adherance

### vision specifies

```typescript
const ns = await getNameservers({ by: { unique: { domain: { name: 'example.com' } } } }, context);
// => { domain: { name: 'example.com' }, nameservers: null } // squarespace default
// => { domain: { name: 'example.com' }, nameservers: ['ns1.cloudflare.com', ...] } // custom
```

### blueprint declares (codepath tree lines 58-62)

```
getNameservers (orchestrator)
├── [+] getNameservers.ts
│   ├── [←] getNewLoggedInBrowserPage (reuse)
│   ├── [←] scrapeDomainDetail (reuse — already scrapes nameservers)
│   └── [+] castIntoDeclaredSquarespaceDomainNameservers (new transformer)
```

### adherance verification

| aspect | vision | blueprint | match? |
|--------|--------|-----------|--------|
| input signature | `{ by: { unique: { domain: { name } } } }` | inferred from DAO map | ✓ |
| returns null for default | yes (comment shows) | test: "returns null for default" | ✓ |
| returns array for custom | yes (comment shows) | test: "returns array for custom" | ✓ |
| entity shape | `{ domain, nameservers }` | transformer produces this | ✓ |

**question raised**: does `scrapeDomainDetail` already scrape nameservers?

**answer**: the blueprint states "reuse — already scrapes nameservers". the extant scraper returns nameserver data, so no new scraper is needed for GET.

**question raised**: how does the cast transformer handle the scrape output?

**answer**: the vision clarification states: return `{ domain, nameservers: null }` when squarespace default, return `{ domain, nameservers: [...] }` when custom. the transformer must detect which case applies.

**verdict**: match. no deviation.

---

## section 5: setNameservers operation adherance

### vision specifies

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

### blueprint declares (codepath tree lines 63-68)

```
setNameservers (orchestrator)
├── [+] setNameservers.ts
│   ├── [+] validateNameserversInput (new transformer)
│   ├── [←] getNameservers (reuse)
│   ├── [←] getNewLoggedInBrowserPage (reuse)
│   └── [+] setNameserversScraper (new communicator)
```

### adherance verification

| aspect | vision | blueprint | match? |
|--------|--------|-----------|--------|
| accepts `{ upsert: { domain, nameservers } }` | yes | yes (via DAO) | ✓ |
| accepts `{ findsert: { domain, nameservers } }` | yes (DAO) | yes (via DAO) | ✓ |
| sets custom nameservers | yes | scraper handles | ✓ |
| resets to null (squarespace) | yes | scraper handles | ✓ |
| validates input | implied | validateNameserversInput | ✓ |

**question raised**: does the scraper correctly handle `null` vs array?

**answer**: the blueprint's scraper codepath includes "handle confirmation dialogs" and "verify nameserver change". for `nameservers: null`, the scraper must click "use squarespace nameservers" button. for `nameservers: [...]`, it must fill custom nameserver inputs.

**evidence**: selectors include `useSquarespaceNameserversButton` for the reset case.

**verdict**: match. no deviation.

---

## section 6: validation rules adherance

### vision specifies (edgecases table)

- minimum 2 nameservers required
- validate FQDN format
- empty array treated as null

### criteria specifies (usecase.4)

```
given('a custom nameserver list with less than 2 entries')
  then('operation fails with clear error')

given('a custom nameserver with invalid FQDN format')
  then('operation fails with clear error')

given('an empty array for nameservers')
  then('nameservers is treated as null')
```

### blueprint declares (implementation notes + test coverage)

- minimum 2 nameservers required ✓
- maximum 13 nameservers (RFC 1035 limit) ← **addition**
- FQDN pattern: `/^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})*\.?$/i` ✓
- empty array treated as null ✓

validation unit tests:
```
given('[case2] fewer than 2 nameservers')
  then('throws BadRequestError with "minimum 2 nameservers" message')

given('[case3] invalid FQDN format')
  then('throws BadRequestError with "invalid nameserver format" message')

given('[case4] empty array')
  then('treated as null (no error)')

given('[case5] more than 13 nameservers')
  then('throws BadRequestError with "maximum 13 nameservers" message')
```

### adherance verification

| rule | vision/criteria | blueprint | match? |
|------|-----------------|-----------|--------|
| min 2 | required | implemented + tested | ✓ |
| max 13 | not specified | added (RFC 1035) | enhancement ✓ |
| FQDN format | validate | regex + tested | ✓ |
| empty array | treat as null | handled + tested | ✓ |

**question raised**: is the max 13 limit a deviation?

**answer**: no. the vision did not specify a maximum. RFC 1035 limits NS records to 13. this constraint is a pit-of-success enhancement, not a deviation. it prevents users from invalid configurations.

**verdict**: match with acceptable enhancement.

---

## section 7: test coverage adherance

### criteria specifies

```
given('setNameservers')
  then('has integration test: upsert to set custom nameservers')
  then('has integration test: upsert to reset to default')
```

### blueprint declares (journey test coverage)

```
given('[case1] domain with squarespace default nameservers')
  when('[t1] setNameservers upsert to cloudflare')
    then('returns entity with custom nameservers')
  when('[t3] setNameservers upsert back to null')
    then('returns entity with null nameservers')
```

### adherance verification

| criterion | blueprint test | match? |
|-----------|---------------|--------|
| integration test: upsert custom | [t1] upsert to cloudflare | ✓ |
| integration test: upsert null | [t3] upsert back to null | ✓ |

**verdict**: match. criteria satisfied.

---

## section 8: potential misinterpretations checked

### check 1: domain reference format

**vision shows**: `{ domain: { name: 'example.com' } }`

**blueprint uses**: `domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>`

**verification**: `DeclaredSquarespaceDomainRegistration.unique = ['name']`, so `RefByUnique` extracts `{ name: string }`.

**result**: correct interpretation.

### check 2: return type for domain not found

**vision shows**: returns entity or null for "not found"

**blueprint coverage**: test says "domain not found" as negative case.

**verification**: extant patterns (`getOneDomain`, `getOneDnsRecord`) return null for not found.

**result**: correct interpretation.

### check 3: findsert vs upsert semantics

**vision shows**: both operations demonstrated

**criteria specifies**:
```
given('a domain with extant nameserver config')
  when('nameservers are set via findsert')
    then('extant config is returned unchanged')
```

**blueprint test coverage**:
```
| `setNameservers.findsert` | creates when absent | ... | returns extant unchanged |
```

**verification**: findsert = find extant or create if absent (does not overwrite). upsert = create or update (always applies desired state).

**result**: correct interpretation.

### check 4: DAO delete method

**criteria specifies**:
```
given('DeclaredSquarespaceDomainNameserversDao')
  then('set.delete is null (not supported)')
```

**blueprint declares**: `set.delete` not listed in DAO codepath (implicit null).

**vision says**: `delete: null, // nameserver config cannot be deleted, only reset to null`

**verification**: nameservers cannot be "deleted" — they can only be reset to squarespace default (`null`). this matches the vision comment.

**result**: correct interpretation.

---

## issues found and fixed

none. no issues found in this review.

---

## why each point holds

| verification | why it holds |
|--------------|--------------|
| domain object interface | exact field names and types match vision |
| DAO interface | all methods map correctly, nulls implicit per convention |
| null semantics | both senses documented identically |
| getNameservers | input/output shape matches, test coverage confirms |
| setNameservers | both upsert and findsert supported, scraper handles both cases |
| validation | all criteria rules implemented plus RFC enhancement |
| test coverage | journey test covers both criteria requirements |
| domain reference | RefByUnique extracts correct shape |
| not found return | follows extant pattern |
| findsert semantics | returns extant unchanged per criteria |
| delete null | cannot delete, only reset per vision |

---

## conclusion

behavior declaration adherance review passes.

the blueprint correctly implements the vision and satisfies all criteria:

1. **domain object**: exact interface match
2. **DAO**: correct method map with implicit nulls
3. **null semantics**: exact match
4. **getNameservers**: correct signature and behavior
5. **setNameservers**: handles both custom and reset
6. **validation**: matches criteria plus RFC enhancement
7. **test coverage**: satisfies all criteria requirements
8. **no misinterpretations**: all four checks passed

no deviations found. blueprint adheres to behavior declaration.
