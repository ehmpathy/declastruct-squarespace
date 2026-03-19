# rule.require.references.devtime

## .what

devtime references must use `RefByUnique`, `RefByPrimary`, or `Ref` from `domain-objects`.

## .why

- intellisense shows exactly what properties are needed
- no one should need to recall how to reference a domain
- pit of success: impossible to create malformed refs

## .how

### RefByUnique (most common)

use when the property references by unique key:

```ts
import { DomainEntity, RefByUnique } from 'domain-objects';

interface DeclaredSquarespaceDomainDnsRecord {
  domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>;  // { name: string }
  name: string;
  type: DeclaredSquarespaceDomainDnsRecordType;
}
```

when you type `domain: { `, intellisense shows `name` — the unique key.

### RefByPrimary

use when the property references by primary key:

```ts
interface SomeEntity {
  domain: RefByPrimary<typeof DeclaredSquarespaceDomainRegistration>;  // { id: string }
}
```

### Ref (union)

use in operation inputs when either primary or unique is acceptable:

```ts
const getOneDomain = async (input: {
  by: PickOne<{
    primary: { id: string };
    unique: { name: string };
    ref: Ref<typeof DeclaredSquarespaceDomainRegistration>;  // accepts either
  }>;
}) => { ... };
```

## .examples

```ts
// good — RefByUnique in domain object
interface DeclaredSquarespaceDomainDnsRecord {
  domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>;
}

// good — Ref in operation input
const resolveDomainRef = async (
  domainRef: Ref<typeof DeclaredSquarespaceDomainRegistration>,
) => { ... };

// bad — inline shape without type
interface BadExample {
  domain: { name: string };  // loses type safety
}
```

## .enforcement

devtime refs without `RefByUnique`, `RefByPrimary`, or `Ref` = blocker
