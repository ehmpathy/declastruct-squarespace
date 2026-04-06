# self-review: has-role-standards-coverage (r12)

## what I reviewed

I went through the blueprint line by line to check that all relevant mechanic standards are covered — not just followed correctly, but present in the first place.

---

## rule directories checked

| directory | relevant rules | checked |
|-----------|----------------|---------|
| `code.prod/evolvable.domain.objects/` | nullable-without-reason, undefined-attributes, immutable-refs | ✓ |
| `code.prod/evolvable.domain.operations/` | get-set-gen-verbs, sync-filename-opname | ✓ |
| `code.prod/evolvable.procedures/` | input-context-pattern, dependency-injection, arrow-only, single-responsibility, named-args | ✓ |
| `code.prod/evolvable.repo.structure/` | directional-deps, barrel-exports | ✓ |
| `code.prod/pitofsuccess.errors/` | failfast, failloud, exit-code-semantics | ✓ |
| `code.prod/pitofsuccess.procedures/` | idempotent-procedures, nonidempotent-mutations | ✓ |
| `code.prod/pitofsuccess.typedefs/` | shapefit, as-cast | ✓ |
| `code.prod/readable.comments/` | what-why-headers | ✓ |
| `code.prod/readable.narrative/` | narrative-flow, named-transformers | ✓ |
| `code.prod/readable.persistence/` | declastruct | ✓ |
| `code.test/frames.behavior/` | given-when-then | ✓ |
| `code.test/scope.coverage/` | test-coverage-by-grain | ✓ |
| `code.test/scope.unit/` | remote-boundaries | ✓ |

---

## section 1: domain object coverage

### required patterns

| pattern | rule source | covered? |
|---------|-------------|----------|
| nullable with documented reason | rule.forbid.nullable-without-reason | ✓ |
| no undefined attributes | rule.forbid.undefined-attributes | ✓ |
| immutable refs | rule.require.immutable-refs | ✓ |
| extends DomainEntity | ref.package.domain-objects | ✓ |
| static unique declaration | ref.package.domain-objects | ✓ |
| RefByUnique for domain ref | rule.require.dobj.references.devtime | ✓ |

### verification

blueprint declares:
```
DeclaredSquarespaceDomainNameservers
├── [+] domain object declaration
│   ├── domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>
│   └── nameservers: string[] | null
```

null semantics documented:
```
- `nameservers: null` = squarespace manages nameservers (default)
- `nameservers: [...]` = custom nameservers (user-specified)
```

**status**: all domain object patterns covered.

---

## section 2: operation coverage

### required patterns

| pattern | rule source | covered? |
|---------|-------------|----------|
| get/set/gen verbs | rule.require.get-set-gen-verbs | ✓ |
| filename === opname | rule.require.sync-filename-opname | ✓ |
| (input, context) signature | rule.require.input-context-pattern | ✓ |
| dependency injection | rule.require.dependency-injection | ✓ |
| arrow functions | rule.require.arrow-only | ✓ |
| single responsibility | rule.require.single-responsibility | ✓ |

### verification

blueprint operations:
- `getNameservers.ts` → `getNameservers` ✓
- `setNameservers.ts` → `setNameservers` ✓
- `castIntoDeclaredSquarespaceDomainNameservers.ts` → `castIntoDeclaredSquarespaceDomainNameservers` ✓
- `validateNameserversInput.ts` → `validateNameserversInput` ✓

all use `(input, context)` pattern from codepath tree.

**status**: all operation patterns covered.

---

## section 3: error coverage

### required patterns

| pattern | rule source | covered? |
|---------|-------------|----------|
| failfast on invalid input | rule.require.failfast | ✓ |
| failloud with context | rule.require.failloud | ✓ |
| BadRequestError for user error | rule.require.failloud | ✓ |

### verification

blueprint validation tests specify:
```
then('throws BadRequestError with "minimum 2 nameservers" message')
then('throws BadRequestError with "invalid nameserver format" message')
```

**status**: error patterns covered.

---

## section 4: idempotency coverage

### required patterns

| pattern | rule source | covered? |
|---------|-------------|----------|
| idempotent operations | rule.require.idempotent-procedures | ✓ |
| findsert/upsert verbs | rule.forbid.nonidempotent-mutations | ✓ |
| no create/insert verbs | rule.forbid.nonidempotent-mutations | ✓ |

### verification

blueprint DAO exposes:
- `set.findsert` — idempotent ✓
- `set.upsert` — idempotent ✓
- `set.delete = null` — not supported, correctly omitted ✓

no create, insert, add, save, or update verbs present.

**status**: idempotency patterns covered.

---

## section 5: test coverage

### required patterns

| pattern | rule source | covered? |
|---------|-------------|----------|
| BDD given/when/then | rule.require.given-when-then | ✓ |
| transformer: unit test | rule.require.test-coverage-by-grain | ✓ |
| communicator: integration test | rule.require.test-coverage-by-grain | ✓ |
| orchestrator: integration test | rule.require.test-coverage-by-grain | ✓ |
| unit tests pure | rule.forbid.remote-boundaries | ✓ |

### verification

blueprint test tree shows:
```
DeclaredSquarespaceDomainNameservers.test.ts        # unit
castIntoDeclaredSquarespaceDomainNameservers.test.ts # unit (transformer)
validateNameserversInput.test.ts                     # unit (transformer)
setNameserversScraper.integration.test.ts            # integration (communicator)
getNameservers.integration.test.ts                   # integration (orchestrator)
setNameservers.play.integration.test.ts              # integration (orchestrator)
```

coverage by layer table confirms correct test types by grain.

**status**: test patterns covered.

---

## section 6: repository structure coverage

### required patterns

| pattern | rule source | covered? |
|---------|-------------|----------|
| directional deps | rule.require.directional-deps | ✓ |
| no barrel exports | rule.forbid.barrel-exports | ✓ |
| domain.objects/ for entities | rule.require.bounded-contexts | ✓ |
| domain.operations/ for behavior | rule.require.bounded-contexts | ✓ |
| access/daos/ for persistence | rule.require.bounded-contexts | ✓ |

### verification

filediff tree shows:
```
src/
├── domain.objects/
│   └── DeclaredSquarespaceDomainNameservers.ts
├── domain.operations/
│   └── domainNameservers/
│       ├── getNameservers.ts
│       └── setNameservers.ts
├── access/
│   ├── daos/
│   │   └── DeclaredSquarespaceDomainNameserversDao.ts
│   └── sdks/squarespace.via.playwright/
│       └── domainNameservers/
│           └── setNameserversScraper.ts
```

no index.ts files specified. each file exports one function.

**status**: repository structure patterns covered.

---

## section 7: readable code coverage

### required patterns

| pattern | rule source | covered? |
|---------|-------------|----------|
| .what/.why JSDoc | rule.require.what-why-headers | ✓ |
| named transformers | rule.require.named-transformers | ✓ |
| narrative flow | rule.require.narrative-flow | ✓ |

### verification

vision shows property JSDoc pattern:
```typescript
/**
 * .what - Custom nameservers for this domain
 * .why - Allows use of external DNS providers like cloudflare
 * .note - null = squarespace default nameservers
 */
nameservers: string[] | null;
```

named transformers:
- `castIntoDeclaredSquarespaceDomainNameservers` — cast transformer ✓
- `validateNameserversInput` — validation transformer ✓

decode-friction logic extracted to transformers per rule.require.named-transformers.

**status**: readable code patterns covered.

---

## section 8: declastruct coverage

### required patterns

| pattern | rule source | covered? |
|---------|-------------|----------|
| genDeclastructDao | rule.prefer.declastruct | ✓ |
| get.one.byUnique | rule.prefer.declastruct | ✓ |
| set.findsert | rule.prefer.declastruct | ✓ |
| set.upsert | rule.prefer.declastruct | ✓ |

### verification

blueprint DAO pattern:
```
DeclaredSquarespaceDomainNameserversDao
├── [+] DAO via genDeclastructDao
│   ├── get.one.byUnique → getNameservers
│   ├── set.findsert → setNameservers({ findsert })
│   └── set.upsert → setNameservers({ upsert })
```

matches declastruct pattern from `rule.prefer.declastruct.[demo]`.

**status**: declastruct patterns covered.

---

## gaps found and fixed

none. all mechanic standards are covered.

---

## summary

| category | patterns | covered | gaps |
|----------|----------|---------|------|
| domain objects | 6 | 6 | 0 |
| operations | 6 | 6 | 0 |
| errors | 3 | 3 | 0 |
| idempotency | 3 | 3 | 0 |
| tests | 5 | 5 | 0 |
| repo structure | 5 | 5 | 0 |
| readable code | 3 | 3 | 0 |
| declastruct | 4 | 4 | 0 |
| **total** | **35** | **35** | **0** |

---

## conclusion

role standards coverage review passes.

all 35 required patterns from mechanic role standards are present in the blueprint:

1. **domain objects**: nullable reason documented, no undefined, immutable refs, DomainEntity, unique, RefByUnique
2. **operations**: get/set verbs, filename sync, input-context, DI, arrow, single responsibility
3. **errors**: failfast, failloud, BadRequestError
4. **idempotency**: idempotent ops, findsert/upsert, no forbidden verbs
5. **tests**: BDD pattern, correct grain coverage, pure unit tests
6. **repo structure**: directional deps, no barrels, bounded contexts
7. **readable code**: JSDoc headers, named transformers, narrative flow
8. **declastruct**: genDeclastructDao with full method map

no gaps found. blueprint has complete coverage of mechanic role standards.
