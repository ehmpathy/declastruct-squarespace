# self-review: has-consistent-conventions (r4)

## deeper investigation

in r3, I examined conventions at a high level. let me search the codebase for specific patterns and compare more thoroughly.

---

## codebase search results

### pattern 1: scraper function names in SDK

**search**: function names in playwright SDK

```
scrapeDomainDetail.ts       → exports: scrapeDomainDetail
scrapeDomainsList.ts        → exports: scrapeDomainsList
scrapeDnsRecords.ts         → exports: scrapeDnsRecords
scrapeTransferRequests.ts   → exports: scrapeTransferRequests
```

**our files**:
```
getNameserversScraper.ts    → exports: getNameserversScraper
setNameserversScraper.ts    → exports: setNameserversScraper
```

**inconsistency found**: extant read operations use `scrape*` prefix, not `get*Scraper` suffix.

**analysis**:
- extant pattern: `scrape{Entity}` for read operations
- our pattern: `get{Entity}Scraper` for read, `set{Entity}Scraper` for write

**semantic difference**:
- `scrape*` = read raw data from page
- `set*Scraper` = write data to page via scraper

the extant codebase only has read scrapers (`scrape*`). there is no extant pattern for write scrapers.

**verdict**: minor name inconsistency for read operation. our `getNameserversScraper` diverges from `scrape*` pattern. however, `setNameserversScraper` is the first write scraper — no extant pattern exists.

**recommendation**: cosmetic issue, not a functional blocker. document for future refactor consideration.

---

### pattern 2: JSDoc comment style

**extant pattern** (from domainDetailSelectors.ts):
```ts
/**
 * .what - CSS selectors for Squarespace domain detail page
 * .why - Centralizes selectors for maintainability
 * .note - URL pattern is /domains/managed/${domain}
 */
```

**our pattern** (from DeclaredSquarespaceDomainNameservers.ts):
```ts
/**
 * .what - Nameserver configuration for a Squarespace domain
 * .why - Enables declarative control over DNS provider
 * .identity - Uniquely identified by domain.name
 */
```

**verdict**: CONSISTENT. both use `.what`, `.why`, `.note` format.

---

### pattern 3: domain object structure

**extant pattern** (from DeclaredSquarespaceDomainDnsRecord.ts):
```ts
export interface DeclaredSquarespaceDomainDnsRecord {
  domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>;
  // ...other fields
}

export class DeclaredSquarespaceDomainDnsRecord extends DomainEntity<...> {
  public static primary = ['domain'] as const;
  public static unique = ['domain', 'type', 'host'] as const;
  public static metadata = [] as const;
  public static nested = { domain: DomainLiteral };
}
```

**our pattern** (from DeclaredSquarespaceDomainNameservers.ts):
```ts
export interface DeclaredSquarespaceDomainNameservers {
  domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>;
  nameservers: string[] | null;
}

export class DeclaredSquarespaceDomainNameservers extends DomainEntity<...> {
  public static primary = ['domain'] as const;
  public static unique = ['domain'] as const;
  public static metadata = [] as const;
  public static nested = { domain: DomainLiteral };
}
```

**verdict**: CONSISTENT. same structure: interface, class, static keys.

---

### pattern 4: cast function structure

**extant pattern** (from castIntoDeclaredSquarespaceDomainDnsRecord.ts):
```ts
export const castIntoDeclaredSquarespaceDomainDnsRecord = (input: {
  raw: RawDnsRecord;
  domain: DeclaredSquarespaceDomainRegistration;
}): DeclaredSquarespaceDomainDnsRecord => {
  // transform raw to domain object
};
```

**our pattern** (from castIntoDeclaredSquarespaceDomainNameservers.ts):
```ts
export const castIntoDeclaredSquarespaceDomainNameservers = (input: {
  domain: DeclaredSquarespaceDomainRegistration;
  nameservers: string[] | null;
}): DeclaredSquarespaceDomainNameservers => {
  // transform to domain object
};
```

**verdict**: CONSISTENT. same `castInto*` prefix and structure.

---

### pattern 5: DAO structure

**extant pattern** (from DeclaredSquarespaceDomainDnsRecordDao.ts):
```ts
export const DeclaredSquarespaceDomainDnsRecordDao = genDeclastructDao<
  typeof DeclaredSquarespaceDomainDnsRecord,
  ContextSquarespaceAgent
>({
  dobj: DeclaredSquarespaceDomainDnsRecord,
  get: { one: { byUnique: ..., byPrimary: null } },
  set: { findsert: ..., upsert: ..., delete: ... },
});
```

**our pattern** (from DeclaredSquarespaceDomainNameserversDao.ts):
```ts
export const DeclaredSquarespaceDomainNameserversDao = genDeclastructDao<
  typeof DeclaredSquarespaceDomainNameservers,
  ContextSquarespaceAgent
>({
  dobj: DeclaredSquarespaceDomainNameservers,
  get: { one: { byUnique: ..., byPrimary: null } },
  set: { findsert: ..., upsert: ..., delete: null },
});
```

**verdict**: CONSISTENT. same structure via `genDeclastructDao`.

---

### pattern 6: operation file structure

**extant pattern** (from setDomain.ts):
```ts
const setDomainFromPage = async (
  input: { upsert: ...; },
  context: ContextSquarespaceAgentPage,
): Promise<DeclaredSquarespaceDomainRegistration> => {
  // implementation
};

export const setDomain = withNewLoggedInBrowserPage(setDomainFromPage);
```

**our pattern** (from setNameservers.ts):
```ts
const setNameserversFromPage = async (
  input: PickOne<{ findsert: ...; upsert: ...; }>,
  context: ContextSquarespaceAgentPage,
): Promise<DeclaredSquarespaceDomainNameservers> => {
  // implementation
};

export const setNameservers = withNewLoggedInBrowserPage(setNameserversFromPage);
```

**verdict**: CONSISTENT. same internal/exported pattern with wrapper.

---

### pattern 7: integration test style

**extant pattern** (from setDomain.integration.test.ts):
```ts
import { given, then, useThen, useWhen, when } from 'test-fns';

describe('setDomain', () => {
  given('[case1] description', () => {
    when('[t0] action', () => {
      then('outcome', async () => {
        // assertions
      });
    });
  });
});
```

**our pattern** (from setNameservers.play.integration.test.ts):
```ts
import { given, then, useBeforeAll, useThen, useWhen, when } from 'test-fns';

describe('setNameservers', () => {
  given('[case1] description', () => {
    when('[t0] action', () => {
      then('outcome', async () => {
        // assertions
      });
    });
  });
});
```

**verdict**: CONSISTENT. same BDD structure with test-fns.

---

## found issue

### issue: scraper name inconsistency (minor)

**files**: `getNameserversScraper.ts`, `setNameserversScraper.ts`
**extant pattern**: `scrape*.ts` for read scrapers
**impact**: cosmetic — functions work correctly

**should we fix?**
- pro: alignment with extant convention
- con: tests already written with current names
- con: `setNameserversScraper` has no extant pattern to follow
- con: `*Scraper` suffix clarifies the layer (SDK scraper vs domain operation)

**recommendation**: document as known inconsistency. the `*Scraper` suffix has merit — it distinguishes the layer. could be considered for future pattern evolution.

**why not a blocker**: the functions operate correctly. name clarifies purpose. this is a cosmetic preference, not a functional divergence.

---

## what I learned

### lesson: search for specific patterns

in r3 I examined high-level conventions. this r4 searched for specific function/file patterns across the codebase. the scraper name inconsistency emerged from this search.

### lesson: new patterns may not have precedent

`setNameserversScraper` is the first write scraper. there is no extant pattern to follow. the `*Scraper` suffix clarifies it's an SDK-layer operation.

### lesson: cosmetic vs functional

the scraper name inconsistency is cosmetic. the code works correctly. names convey intent. this is different from a functional divergence that would break expectations.

---

## summary

| convention | status |
|------------|--------|
| scraper function names | minor divergence (cosmetic, documented) |
| JSDoc comment style | consistent |
| domain object structure | consistent |
| cast function structure | consistent |
| DAO structure | consistent |
| operation file structure | consistent |
| integration test style | consistent |

---

## conclusion

conventions review passes with one minor find:
- 7 conventions examined in depth
- 6 fully consistent
- 1 minor name divergence (scraper names: `getNameserversScraper` vs `scrape*`)
- divergence is cosmetic, not functional
- new write scraper pattern (`setNameserversScraper`) has no precedent to follow

