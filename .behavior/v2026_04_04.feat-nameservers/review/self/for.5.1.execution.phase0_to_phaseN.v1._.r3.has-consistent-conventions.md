# self-review: has-consistent-conventions (r3)

## what I reviewed

I compared the nameservers feature names and patterns against extant codebase conventions.

---

## the question I asked

> "do we use a different namespace, prefix, or suffix pattern? do we introduce new terms when extant terms exist?"

---

## conventions examined

### convention 1: operation name pattern

**extant pattern**:
- `getOneDomain`, `getAllDomains`, `setDomain`
- `getOneDnsRecord`, `getAllDnsRecords`
- `getOneTransferRequest`, `getAllTransferRequests`, `setTransferRequest`

**our names**:
- `getNameservers` (not `getOneNameservers`)
- `setNameservers`

**is this inconsistent?**

let me examine the semantics:
- `getOneDomain` returns `DeclaredSquarespaceDomainRegistration | null`
- `getOneTransferRequest` returns `DeclaredSquarespaceDomainTransferRequest | null`
- `getNameservers` returns `DeclaredSquarespaceDomainNameservers` (never null)

**key difference**: extant `getOne*` operations return `T | null` because the resource might not exist. nameservers always exist for a domain (either custom or squarespace default).

**verdict**: NOT inconsistent. the name signals different semantics. `getOne*` implies nullable return. `getNameservers` returns non-nullable because nameservers always exist.

---

### convention 2: folder names

**extant domain.operations folders**:
- `domainRegistration` (singular)
- `domainDnsRecord` (singular)
- `domainTransferRequest` (singular)

**our folder**: `domainNameservers` (plural)

**is this inconsistent?**

let me examine the pattern:
- folder names match domain object names (minus `DeclaredSquarespace` prefix)
- `DeclaredSquarespaceDomainRegistration` → `domainRegistration`
- `DeclaredSquarespaceDomainDnsRecord` → `domainDnsRecord`
- `DeclaredSquarespaceDomainNameservers` → `domainNameservers`

**verdict**: CONSISTENT. folder name matches domain object name suffix.

---

### convention 3: SDK folder names

**extant SDK folders**:
- `domainDetail`, `domainsList`, `transfersList`, `dnsSettings`

**our folder**: `domainNameservers`

**verdict**: CONSISTENT. follows same pattern as extant SDK folders.

---

### convention 4: domain object names

**extant pattern**:
- `DeclaredSquarespaceDomain{Entity}` where Entity is the concept

**our name**: `DeclaredSquarespaceDomainNameservers`

**verdict**: CONSISTENT. follows extant prefix pattern.

---

### convention 5: DAO names

**extant pattern**:
- `DeclaredSquarespaceDomain{Entity}Dao`

**our name**: `DeclaredSquarespaceDomainNameserversDao`

**verdict**: CONSISTENT. follows extant suffix pattern.

---

### convention 6: cast function names

**extant pattern**:
- `castIntoDeclaredSquarespaceDomain{Entity}`

**our name**: `castIntoDeclaredSquarespaceDomainNameservers`

**verdict**: CONSISTENT. follows extant pattern.

---

### convention 7: test file names

**extant pattern**:
- `{operationName}.test.ts` for unit tests
- `{operationName}.integration.test.ts` for integration tests

**our names**:
- `getNameservers.test.ts`, `getNameservers.integration.test.ts`
- `setNameservers.test.ts`, `setNameservers.play.integration.test.ts`

**verdict**: CONSISTENT. follows extant pattern.

---

## summary

| convention | status |
|------------|--------|
| operation name pattern | consistent (different semantics justify different name) |
| folder names | consistent |
| SDK folder names | consistent |
| domain object names | consistent |
| DAO names | consistent |
| cast function names | consistent |
| test file names | consistent |

---

## what I learned

### lesson: name can signal semantics

`getOne*` implies `T | null` (resource might not exist). the absence of `One` in `getNameservers` signals `T` (resource always exists). consistency includes semantic alignment.

### lesson: check domain object name alignment

folder names in domain.operations follow domain object names. the plural "Nameservers" in `DeclaredSquarespaceDomainNameservers` is correct because it represents a collection property.

---

## conclusion

conventions review passes:
- 7 conventions examined
- 7 consistent
- 0 divergent
- differences have semantic justification

