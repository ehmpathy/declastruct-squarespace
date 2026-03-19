# rule.require.references.runtime

## .what

runtime references must use `refByUnique` or `refByPrimary` from `domain-objects`.

## .why

- extracts only the correct key properties from instances
- no one should need to recall which properties to pick
- pit of success: impossible to create malformed refs

## .how

### refByUnique

extracts unique key properties from an instance:

```ts
import { refByUnique } from 'domain-objects';

const domain = new DeclaredSquarespaceDomainRegistration({
  id: 'abc123',
  name: 'example.com',
  isLocked: false
});

const domainRef = refByUnique<typeof DeclaredSquarespaceDomainRegistration>(domain);
// domainRef = { name: 'example.com' }
```

### refByPrimary

extracts primary key properties from an instance:

```ts
import { refByPrimary } from 'domain-objects';

const domainRef = refByPrimary<typeof DeclaredSquarespaceDomainRegistration>(domain);
// domainRef = { id: 'abc123' }
```

## .examples

```ts
// good — use refByUnique
const domainRef = refByUnique<typeof DeclaredSquarespaceDomainRegistration>(domain);

// good — use refByPrimary
const domainRef = refByPrimary<typeof DeclaredSquarespaceDomainRegistration>(domain);

// bad — manual property extraction
const domainRef = { name: domain.name };  // fragile, error-prone
```

## .enforcement

runtime refs via manual property extraction = blocker
