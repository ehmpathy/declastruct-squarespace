# plan: scrape renewal status from domains list page

## .what

refactor to detect `renewal: 'ENABLED' | 'DISABLED'` from the domains list page instead of per-domain detail page lookups.

## .why

- **performance**: single page load for all domains vs N page loads (one per domain)
- **simplicity**: remove entire DomainSubscription stack (object, operations, selectors, scraper)
- **cohesion**: renewal is a property of the domain registration, not a separate entity

## .discovery

via manual browser exploration (`browser.action` + `browser.snapshot`):

| renewal state | expiration column appearance |
|---------------|------------------------------|
| ENABLED       | 🔄 Mar 19, 2027 (refresh icon present) |
| DISABLED      | Mar 19, 2027 (no icon) |

the circular refresh/arrow icon next to the expiration date indicates auto-renewal is enabled.

## .changes

### 1. update DeclaredSquarespaceDomainRegistration

add `renewal: 'ENABLED' | 'DISABLED'` attribute back to the domain object:

```ts
interface DeclaredSquarespaceDomainRegistration {
  // ... extant fields
  renewal: 'ENABLED' | 'DISABLED';
}
```

### 2. update domainsListSelectors.ts

add selector for renewal indicator icon in expiration column:

```ts
export const domainsListSelectors = {
  // ... extant selectors
  renewalIndicator: '[data-testid="renewal-icon"], svg[aria-label*="renew"]',
  expirationCell: 'td:has([data-testid="expiration-date"])',
};
```

### 3. update scrapeDomainsListPage.ts

detect renewal status by presence of refresh icon in expiration column:

```ts
// for each domain row
const expirationCell = row.querySelector(selectors.expirationCell);
const hasRenewalIcon = expirationCell?.querySelector('svg') !== null;
const renewal = hasRenewalIcon ? 'ENABLED' : 'DISABLED';
```

### 4. update castIntoDeclaredSquarespaceDomainRegistration.ts

accept and pass through renewal status from raw scrape data.

### 5. delete DomainSubscription stack

remove:
- `src/domain.objects/DeclaredSquarespaceDomainSubscription.ts`
- `src/domain.operations/domainSubscription/` (entire directory)
- `src/access/sdks/squarespace.via.playwright/domainSubscription/` (entire directory)
- `src/access/sdks/squarespace.via.playwright/selectors/domainSubscriptionSelectors.ts`
- `src/access/daos/DeclaredSquarespaceDomainSubscriptionDao.ts`

### 6. update provider and exports

- remove DomainSubscription from provider
- remove DomainSubscription from SDK exports
- remove from cache deserialization array

### 7. update provision/usecase.transferout/listDomains.ts

simplify to use renewal from domain registration directly:

```ts
const domains = await getAllDomains({}, provider.context);
// no longer need getAllSubscriptions + join
// renewal is already on each domain
```

### 8. update tests

- remove domainSubscription integration tests
- add renewal detection tests to domainRegistration tests

## .verification

1. run `npm run test:integration -- getAllDomains` - should return domains with renewal status
2. run `npm run test:integration -- setDomain` - should handle renewal toggle
3. run `npx tsx provision/usecase.transferout/listDomains.ts` - should show renewal status

## .risks

- renewal icon selector may differ across squarespace UI versions
- if squarespace adds more icons in expiration column, detection may false-positive

## .mitigation

- use specific data-testid or aria-label selectors if available
- fall back to SVG path analysis if needed
- add snapshot test to detect UI drift
