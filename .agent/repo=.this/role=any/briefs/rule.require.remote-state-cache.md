# rule.require.remote-state-cache

## .what

all get* operations that scrape squarespace MUST be wrapped with `withRemoteStateQueryCache`.

## .why

squarespace has no api — we scrape via playwright. each scrape:
- takes 5-30 seconds per page
- risks rate limits and bot detection
- requires authenticated browser session
- navigates through react spa (slow initial render)

without cache:
- declastruct plan runs take 10+ minutes for 300 domains
- repeated plans re-scrape all data
- bot detection triggers increase with request volume

with cache:
- first run scrapes, subsequent runs are instant
- 24-hour expiration balances freshness vs performance
- mutations invalidate relevant cache entries

## .pattern

### step 1: wrap get* with cache

```ts
// in get{Entity}.ts
import { withRemoteStateQueryCache } from '../../infra/performance/withRemoteStateCache';

const {
  execute: get{Entity}WithCache,
  addTrigger: addTriggerToGet{Entity},
} = withRemoteStateQueryCache(
  withNewLoggedInBrowserPage(get{Entity}FromPage),
  { name: 'get{Entity}' },
);

export const get{Entity} = get{Entity}WithCache;
export { addTriggerToGet{Entity} };
```

### step 2: wrap set* with mutation registration and invalidate cache

mutations must:
1. wrap with `withRemoteStateMutationRegistration`
2. register triggers to invalidate related caches (targeted to specific domain only)

```ts
// in set{Entity}.ts
import { withRemoteStateMutationRegistration } from '../../infra/performance/withRemoteStateCache';
import { addTriggerToGet{Entity} } from './get{Entity}';

// define input type with findsert/upsert pattern
type Set{Entity}Input = PickOne<{
  findsert: Declared{Entity};
  upsert: Declared{Entity};
}>;

// wrap mutation
const set{Entity}Mutation = withRemoteStateMutationRegistration(
  set{Entity}WithPage,
  { name: { override: 'set{Entity}' } },
);

// register cache invalidation trigger (targeted to specific domain only)
addTriggerToGet{Entity}({
  invalidatedBy: {
    mutation: set{Entity}Mutation,
    affects: ({
      cachedQueryKeys,
      mutationInput,
    }: {
      cachedQueryKeys: string[];
      mutationInput: Set{Entity}Input;
    }) => {
      // extract domain name from mutation input
      const domainName = (mutationInput.findsert ?? mutationInput.upsert)?.domain?.name;
      if (!domainName) return { keys: [] };

      // filter to only cache keys that contain this domain name
      // .note = cache key format includes domain name in preview segment (dots replaced with _)
      const keysToInvalidate = cachedQueryKeys.filter((key) =>
        key.includes(domainName.replace(/\./g, '_')),
      );
      return { keys: keysToInvalidate };
    },
  },
});

export const set{Entity} = set{Entity}Mutation.execute;
```

this ensures that after `set{Entity}` runs for domain X, only the cache for domain X is invalidated — other domains retain their cache.

### step 3: register domain object for deserialization

add new domain objects to the deserialize list in `withRemoteStateCache.ts`:

```ts
deserialize: {
  value: (cached) => {
    return deserialize(cached, {
      with: [
        DeclaredSquarespaceDomainRegistration,
        Declared{Entity},  // add new types here
        // ...
      ],
    });
  },
},
```

## .cache location

```
.cache/squarespace/
```

clear manually via `rm -rf .cache/squarespace` to force fresh scrape.

## .enforcement

get* operation without `withRemoteStateQueryCache` = blocker

## .see also

- ref.remote-state-query-cache.md — cache expiration and implementation details
