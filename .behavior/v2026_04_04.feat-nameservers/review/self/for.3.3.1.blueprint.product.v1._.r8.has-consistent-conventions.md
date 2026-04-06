# self-review: has-consistent-conventions (r8)

## what I reviewed

I examined each name choice in the blueprint against extant codebase conventions to identify divergences.

---

## extant name patterns

### domain objects

```
DeclaredSquarespaceDomain{Feature}.ts
```

examples:
- `DeclaredSquarespaceDomainDnsRecord` (singular — one record)
- `DeclaredSquarespaceDomainTransferRequest` (singular — one request)
- `DeclaredSquarespaceDomainRegistration` (singular — one registration)

### DAOs

```
DeclaredSquarespaceDomain{Feature}Dao.ts
```

examples:
- `DeclaredSquarespaceDomainDnsRecordDao`
- `DeclaredSquarespaceDomainTransferRequestDao`
- `DeclaredSquarespaceDomainRegistrationDao`

### operations folder

```
domain{Feature}/
```

examples:
- `domainDnsRecord/`
- `domainTransferRequest/`
- `domainRegistration/`

### operations (get)

```
getOne{Entity}.ts    — lookup single entity by key
getAll{Entities}.ts  — list entities
```

examples:
- `getOneDomain`, `getAllDomains`
- `getOneDnsRecord`, `getAllDnsRecords`
- `getOneTransferRequest`, `getAllTransferRequests`

### operations (set)

```
set{Entity}.ts
```

examples:
- `setDomain`
- `setTransferRequest`

### transformers (cast)

```
castIntoDeclaredSquarespace{Entity}.ts
```

examples:
- `castIntoDeclaredSquarespaceDomainDnsRecord`
- `castIntoDeclaredSquarespaceDomainTransferRequest`
- `castIntoDeclaredSquarespaceDomainRegistration`

---

## blueprint names vs extant patterns

| blueprint | extant pattern | status |
|-----------|----------------|--------|
| `DeclaredSquarespaceDomainNameservers` | `DeclaredSquarespaceDomain{Feature}` | divergent — plural vs singular |
| `DeclaredSquarespaceDomainNameserversDao` | `DeclaredSquarespaceDomain{Feature}Dao` | consistent |
| `domainNameservers/` | `domain{Feature}/` | consistent |
| `getNameservers` | `getOne{Entity}` or `getAll{Entities}` | divergent — no cardinality prefix |
| `setNameservers` | `set{Entity}` | consistent |
| `castIntoDeclaredSquarespaceDomainNameservers` | `castIntoDeclared...` | consistent |

---

## analysis of divergences

### divergence 1: plural entity name

**blueprint**: `DeclaredSquarespaceDomainNameservers`
**extant pattern**: singular entity names (`DnsRecord`, `TransferRequest`, `Registration`)

**analysis**:

in DNS terminology, "nameservers" is commonly treated as a unit, not individual items:
- "what are the nameservers for this domain?" (common phrase)
- "what is the nameserver config for this domain?" (awkward phrase)

the entity represents the collection of nameservers for ONE domain, managed as a single unit. you cannot set one nameserver; you set the entire list.

**alternatives considered**:
- `DeclaredSquarespaceDomainNameserverConfig` — more consistent with singular pattern
- `DeclaredSquarespaceDomainNameservers` — matches domain terminology

**verdict**: acceptable divergence. the plural name reflects domain semantics (nameservers as a unit). documented reason: DNS conventions.

### divergence 2: operation without cardinality prefix

**blueprint**: `getNameservers`, `setNameservers`
**extant pattern**: `getOne*`, `getAll*`, `set*`

**analysis**:

extant cardinality prefixes:
- `getOne*` — returns single entity or null
- `getAll*` — returns list of entities

`getNameservers` returns the nameservers config for ONE domain, so semantically it's `getOne`. but `getOneNameservers` is grammatically awkward ("one nameservers").

**alternatives considered**:
- `getOneNameservers` — grammatically awkward
- `getNameserverConfig` — requires entity rename
- `getNameservers` — clear, matches entity name

**verdict**: acceptable divergence. `getNameservers` is clear — it gets the nameservers (plural) for one domain. the awkwardness of `getOneNameservers` outweighs consistency.

---

## non-divergent items

all other names follow extant patterns:

| name | pattern match |
|------|---------------|
| `DeclaredSquarespaceDomainNameserversDao` | `{Entity}Dao` ✓ |
| `domainNameservers/` folder | `domain{Feature}/` ✓ |
| `castIntoDeclaredSquarespaceDomainNameservers` | `castIntoDeclared...` ✓ |
| `validateNameserversInput` | new transformer (no conflict) ✓ |
| `setNameserversScraper` | follows `set*Scraper` pattern ✓ |

---

## what I learned

### lesson 1: domain terminology can justify divergence

when an extant pattern conflicts with domain terminology, domain clarity can take precedence. "nameservers" is how DNS practitioners talk about the concept.

### lesson 2: document divergence reasons

when divergence is justified, document why. future maintainers can understand the rationale.

### lesson 3: grammatical awkwardness is a valid concern

`getOneNameservers` would be technically consistent but hard to read. readability matters.

---

## conclusion

conventions review passes with documented divergences:
- entity name is plural (`Nameservers`) — justified by DNS terminology
- operation lacks cardinality prefix (`getNameservers`) — justified by grammatical clarity
- all other names follow extant patterns
- divergences are minor and documented
