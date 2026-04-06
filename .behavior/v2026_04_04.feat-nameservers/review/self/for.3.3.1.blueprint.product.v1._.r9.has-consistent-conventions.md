# self-review: has-consistent-conventions (r9)

## what I reviewed

I re-examined every name in the blueprint against extant codebase conventions, with fresh searches to verify patterns.

---

## extant convention search results

### domain objects

```bash
grep -r "class Declared" src/domain.objects/
```

| extant name | pattern |
|-------------|---------|
| `DeclaredSquarespaceDomainRegistration` | singular |
| `DeclaredSquarespaceDomainDnsRecord` | singular |
| `DeclaredSquarespaceDomainTransferRequest` | singular |

**pattern**: `DeclaredSquarespaceDomain{Feature}` where Feature is singular.

### folder names

```bash
tree -d -L 2 src/domain.operations/
```

| extant folder | pattern |
|---------------|---------|
| `domainRegistration/` | singular noun |
| `domainDnsRecord/` | singular noun |
| `domainTransferRequest/` | singular noun (compound) |

**pattern**: `domain{Feature}/` where Feature is singular.

### operations (get)

```bash
grep -r "^export const (get|set)" src/domain.operations/
```

| extant operation | pattern |
|------------------|---------|
| `getOneDomain` | getOne + singular |
| `getAllDomains` | getAll + plural |
| `getOneDnsRecord` | getOne + singular |
| `getAllDnsRecords` | getAll + plural |
| `getOneTransferRequest` | getOne + singular |
| `getAllTransferRequests` | getAll + plural |

**pattern**: `getOne{Entity}` for single lookup, `getAll{Entities}` for list.

### operations (set)

| extant operation | pattern |
|------------------|---------|
| `setDomain` | set + singular |
| `setTransferRequest` | set + singular |

**pattern**: `set{Entity}` for mutation.

### transformers (cast)

```bash
grep -r "castInto" src/domain.operations/
```

| extant transformer | pattern |
|--------------------|---------|
| `castIntoDeclaredSquarespaceDomainRegistration` | castInto + full entity name |
| `castIntoDeclaredSquarespaceDomainDnsRecord` | castInto + full entity name |
| `castIntoDeclaredSquarespaceDomainTransferRequest` | castInto + full entity name |

**pattern**: `castIntoDeclared{FullEntityName}`.

### validation

```bash
grep -r "validate" src/domain.operations/ --files-with-matches
```

**result**: no dedicated `validate*` functions. validation is inline with `BadRequestError` throws.

example from `setDomain.ts` lines 56-65:
```typescript
if (domainDesired.isLocked === false && domainFound.lockReason) {
  throw new BadRequestError(
    'domain cannot be unlocked due to lock restriction',
    { ... },
  );
}
```

**pattern**: validation inline, not extracted.

---

## blueprint names vs extant patterns

| blueprint name | extant pattern | status |
|----------------|----------------|--------|
| `DeclaredSquarespaceDomainNameservers` | singular Feature | **DIVERGENT** |
| `domainNameservers/` | singular Feature | **DIVERGENT** |
| `getNameservers` | `getOne*` or `getAll*` | **DIVERGENT** |
| `setNameservers` | `set{Entity}` | consistent |
| `castIntoDeclaredSquarespaceDomainNameservers` | `castInto{FullName}` | consistent |
| `validateNameserversInput` | inline validation | **NEW PATTERN** |
| `DeclaredSquarespaceDomainNameserversDao` | `{Entity}Dao` | consistent |

---

## analysis of each divergence

### divergence 1: plural entity name (`Nameservers` vs `Nameserver`)

**question**: should the entity be `DeclaredSquarespaceDomainNameserver` (singular)?

**analysis**:

extant singular entities represent ONE resource:
- `DomainRegistration` = one domain registration
- `DnsRecord` = one DNS record
- `TransferRequest` = one transfer request

the nameservers entity represents the nameserver **configuration** for one domain, which is managed as a **unit**. you cannot set one nameserver; you set the entire list.

**alternatives considered**:
1. `DeclaredSquarespaceDomainNameserver` (singular) — would confuse readers, implies one nameserver
2. `DeclaredSquarespaceDomainNameserverConfig` — adds "Config" suffix, maintains singular pattern
3. `DeclaredSquarespaceDomainNameservers` — matches DNS terminology ("the nameservers")

**decision**: option 3 is acceptable. DNS terminology treats "nameservers" as a unit. the divergence is documented and justified by domain semantics.

**if strict alignment were needed**: rename to `DeclaredSquarespaceDomainNameserverConfig` with folder `domainNameserverConfig/`. this would match the singular pattern while being clear it's a configuration object. however, the plural form is more natural in DNS vocabulary.

**verdict**: acceptable divergence with documented rationale.

### divergence 2: plural folder name (`domainNameservers/` vs `domainNameserver/`)

**question**: should the folder be `domainNameserver/` (singular)?

**analysis**: folder name follows entity name. if entity is plural, folder is plural.

**verdict**: follows from divergence 1. same rationale.

### divergence 3: operation lacks cardinality prefix (`getNameservers` vs `getOneNameservers`)

**question**: should the operation be `getOneNameservers`?

**analysis**:

extant cardinality prefixes:
- `getOne*` returns single entity or null — lookup by key
- `getAll*` returns list of entities — enumeration

`getNameservers` returns the nameserver config for ONE domain. semantically it's a `getOne` operation.

**options**:
1. `getOneNameservers` — grammatically awkward ("one nameservers")
2. `getOneNameserverConfig` — requires entity rename
3. `getNameservers` — clear, natural

**verdict**: `getNameservers` is acceptable. the operation gets the nameservers (plural) for one domain. the awkwardness of "getOneNameservers" outweighs strict convention adherence.

### new pattern: `validateNameserversInput` transformer

**question**: should validation be inline (like extant code) or extracted?

**analysis**:

extant pattern: inline validation in orchestrator with `BadRequestError`:
```typescript
if (condition) throw new BadRequestError('message', { ... });
```

blueprint proposes: separate `validateNameserversInput` transformer.

**arguments for extraction**:
1. nameserver validation has multiple rules (min 2, max 13, FQDN format)
2. separate transformer enables isolated unit tests
3. validation logic is reusable if other code needs to validate NS input
4. follows rule.require.single-responsibility

**arguments for inline**:
1. breaks extant pattern
2. adds file when code could be inline
3. extant validation is simple (one condition)

**key difference**: extant validation is simple boolean checks. nameserver validation has:
- minimum count check (2)
- maximum count check (13)
- FQDN regex validation for each entry
- empty array normalization

this complexity justifies extraction.

**verdict**: new pattern is justified. document as intentional evolution for complex validation.

---

## what holds and why

| name | holds | rationale |
|------|-------|-----------|
| `DeclaredSquarespaceDomainNameservers` | yes | DNS terminology treats "nameservers" as unit |
| `domainNameservers/` | yes | follows entity name |
| `getNameservers` | yes | avoids grammatical awkwardness of "getOneNameservers" |
| `setNameservers` | yes | follows `set{Entity}` pattern |
| `castIntoDeclared...` | yes | follows extant pattern exactly |
| `validateNameserversInput` | yes | complex validation justifies extraction |
| `DeclaredSquarespaceDomainNameserversDao` | yes | follows `{Entity}Dao` pattern |
| selectors | yes | adds only new edit selectors, no duplication |

---

## lesson learned

### lesson 1: domain terminology can justify pattern divergence

when an extant pattern conflicts with domain vocabulary, clarity for domain experts can take precedence. "nameservers" is how DNS practitioners speak.

### lesson 2: complexity can justify pattern evolution

simple inline validation works for boolean checks. complex multi-rule validation justifies extraction for testability and single responsibility.

### lesson 3: document divergence reasons

future maintainers benefit from explicit rationale. each divergence above has documented "why" so the decision can be revisited if needed.

---

## conclusion

conventions review passes with documented divergences:

- **3 divergences identified** (plural name, plural folder, operation lacks prefix)
- **all divergences justified** by DNS terminology and grammatical clarity
- **1 new pattern identified** (`validateNameserversInput` extraction)
- **new pattern justified** by validation complexity
- **all other names follow extant patterns exactly**

no changes to blueprint required. divergences are intentional and documented.
