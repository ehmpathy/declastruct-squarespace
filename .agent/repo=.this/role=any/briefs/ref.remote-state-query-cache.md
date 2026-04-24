# ref.remote-state-query-cache

## .what

`withRemoteStateQueryCache` wraps remote state queries with persistent on-disk cache to avoid redundant scrapes in declastruct plan/apply cycles.

## .why

squarespace has no API — we scrape via playwright. each scrape:
- takes 5-30 seconds
- risks rate limits / bot detection
- requires authenticated browser session

cache enables:
- fast `declastruct plan` iterations (sub-second after first run)
- reduced load on squarespace servers
- fewer bot detection triggers

## .how

### cache location

```
.cache/squarespace/
```

configured in `getSquarespaceAgentOptions.ts`:

```ts
const cacheDirectory = input.cache?.directory ?? '.cache/squarespace';
const remoteStateCache = createOnDiskCache({
  directory: { mounted: { path: cacheDirectory } },
  expiration: { hours: 24 },
});
```

### cache expiration

default: **24 hours**

after expiration, next query fetches fresh data from squarespace.

### cache key

queries are keyed by operation name + input hash. same inputs = cache hit.

### clear the cache

to force fresh data (e.g., after you fix a scraper bug):

```sh
rm -rf .cache/squarespace
```

then run `declastruct plan` again.

## .when to clear

clear the cache when:
- you fixed a scraper/parser bug and need fresh data
- remote state changed and you need immediate refresh
- cache shows stale data (e.g., wrong expiration dates)

## .pattern

```ts
import { withRemoteStateQueryCache } from './withRemoteStateQueryCache';

const getAllDomains = withRemoteStateQueryCache(
  async (input, context) => {
    // expensive playwright scrape
    return scrapeDomains(context.page);
  },
  { name: 'getAllDomains' },
);
```

## .see also

- `simple-on-disk-cache` package — cache implementation
- `getSquarespaceAgentOptions.ts` — cache configuration
- `withRemoteStateQueryCache.ts` — cache wrapper implementation
