# rule.forbid.dobj.bagrefs

## .what

forbid untyped inline object literals (bag refs) for domain object references.

## .why

- bag refs lack type safety
- bag refs require you to recall which properties to pick
- bag refs are fragile and error-prone

## .how

use `refByUnique` or `refByPrimary` — either way, it's clearly typed:

```ts
// bad - untyped bag ref
const record = new DeclaredSquarespaceDomainDnsRecord({
  domain: { name: 'example.com' },  // untyped bag ref
  // ...
});

// good - have instance, use refByUnique(instance)
const record = new DeclaredSquarespaceDomainDnsRecord({
  domain: refByUnique(domain),
  // ...
});

// good - no instance, use RefByUnique.as<typeof Class>({ ... })
const record = new DeclaredSquarespaceDomainDnsRecord({
  domain: RefByUnique.as<typeof DeclaredSquarespaceDomainRegistration>({ name: 'example.com' }),
  // ...
});
```

## .enforcement

untyped bag refs for domain object references = blocker
