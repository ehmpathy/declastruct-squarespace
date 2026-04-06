# self-review: has-consistent-mechanisms (r2)

## what I reviewed

I compared the new nameservers mechanisms against extant codebase mechanisms to identify any duplication.

---

## the question I asked

> "does the codebase already have a mechanism that does this?"

---

## mechanisms examined

### mechanism 1: withNewLoggedInBrowserPage wrapper

**what we use**:
```typescript
// in getNameservers.ts and setNameservers.ts
export const getNameservers = withNewLoggedInBrowserPage(getNameserversFromPage);
export const setNameservers = withNewLoggedInBrowserPage(setNameserversFromPage);
```

**does extant mechanism exist?**
- yes: `src/access/sdks/squarespace.via.playwright/wrappers/withNewLoggedInBrowserPage.ts`
- used in: domain registration operations

**verdict**: REUSED extant mechanism. good.

---

### mechanism 2: waitForSquarespaceReactRender

**what we use**:
```typescript
// in getNameserversScraper.ts and setNameserversScraper.ts
await waitForSquarespaceReactRender({ page, forContent: ... });
```

**does extant mechanism exist?**
- yes: `src/access/sdks/squarespace.via.playwright/navigation/waitForSquarespaceReactRender.ts`
- used in: all scrapers

**verdict**: REUSED extant mechanism. good.

---

### mechanism 3: handleReauthentication

**what we use**:
```typescript
// in setNameserversScraper.ts
await handleReauthentication(page, credentials);
```

**does extant mechanism exist?**
- yes: `src/access/sdks/squarespace.via.playwright/auth/handleReauthentication.ts`
- used in: domain registration operations that trigger reauth

**verdict**: REUSED extant mechanism. good.

---

### mechanism 4: emitBrowserMovieFrame

**what we use**:
```typescript
// in scrapers
await emitBrowserMovieFrame({ page, frame: { name: '...' } });
```

**does extant mechanism exist?**
- yes: `src/_topublish/kermet/emitBrowserMovieFrame.ts`
- used in: all scrapers for debug frames

**verdict**: REUSED extant mechanism. good.

---

### mechanism 5: domainDetailSelectors

**what we use**:
```typescript
// in scrapers
import { domainDetailSelectors } from '../selectors/domainDetailSelectors';
```

**does extant mechanism exist?**
- yes: centralized selectors file
- we added new selectors to the SAME file

**verdict**: EXTENDED extant mechanism (not duplicated). good.

---

### mechanism 6: genDeclastructDao

**what we use**:
```typescript
// in DeclaredSquarespaceDomainNameserversDao.ts
export const DeclaredSquarespaceDomainNameserversDao = genDeclastructDao({ ... });
```

**does extant mechanism exist?**
- yes: from `declastruct` package
- used in: all DAOs in this codebase

**verdict**: REUSED extant mechanism. good.

---

### mechanism 7: RefByUnique from domain-objects

**what we use**:
```typescript
// in DeclaredSquarespaceDomainNameservers.ts
domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>;
```

**does extant mechanism exist?**
- yes: from `domain-objects` package
- used in: all domain objects with references

**verdict**: REUSED extant mechanism. good.

---

### mechanism 8: BadRequestError

**what we use**:
```typescript
// in validateNameserversInput.ts
throw new BadRequestError('minimum 2 nameservers required', { ... });
```

**does extant mechanism exist?**
- yes: from `helpful-errors` package
- used in: all validation failures

**verdict**: REUSED extant mechanism. good.

---

### mechanism 9: castInto* pattern

**what we created**:
```typescript
// new file: castIntoDeclaredSquarespaceDomainNameservers.ts
export const castIntoDeclaredSquarespaceDomainNameservers = (input) => { ... };
```

**does extant mechanism exist?**
- yes: `castIntoDeclaredSquarespaceDomainRegistration.ts` follows same pattern
- pattern: cast from raw scraper output to domain object

**verdict**: FOLLOWED extant pattern (not duplicated). good.

---

### mechanism 10: validate* pattern

**what we created**:
```typescript
// new file: validateNameserversInput.ts
export const validateNameserversInput = (input) => { ... };
```

**does extant mechanism exist for this specific validation?**
- no: nameserver validation is unique to this feature
- but: validation pattern follows extant convention (separate file, BadRequestError)

**verdict**: NEW mechanism for unique validation need. follows convention. good.

---

### mechanism 11: getNameserversScraper (NEW)

**what we created**:
```typescript
// new file: getNameserversScraper.ts
export const getNameserversScraper = async ({ page, domain }) => { ... };
```

**could we reuse scrapeDomainDetail?**
- blueprint assumed yes, but technically no
- scrapeDomainDetail returns `nameservers: string[]` (always array)
- we need `nameservers: string[] | null` (null for squarespace default)
- scrapeDomainDetail scrapes main page; we need nameservers settings page

**verdict**: NEW mechanism justified - extant cannot provide required semantics.

---

## what I found

### found: all mechanisms consistent

| mechanism | status |
|-----------|--------|
| withNewLoggedInBrowserPage | reused |
| waitForSquarespaceReactRender | reused |
| handleReauthentication | reused |
| emitBrowserMovieFrame | reused |
| domainDetailSelectors | extended |
| genDeclastructDao | reused |
| RefByUnique | reused |
| BadRequestError | reused |
| castInto* pattern | followed |
| validate* pattern | followed |
| getNameserversScraper | new, justified |

### found: one new mechanism

`getNameserversScraper.ts` is new, but justified because:
1. extant `scrapeDomainDetail` cannot determine null vs custom
2. different page URL required (`/dns/domain-nameservers` vs main detail)
3. button visibility check required (not available on main page)

---

## the duplication check

### could we use scrapeDomainDetail instead?

let me verify this was truly necessary:

**scrapeDomainDetail returns**:
```typescript
nameservers: string[] // always an array, even for squarespace default
```

**we need**:
```typescript
nameservers: string[] | null // null = squarespace default
```

**how do we detect squarespace default?**
- "USE SQUARESPACE NAMESERVERS" button is visible only when custom NS configured
- this button is on the `/dns/domain-nameservers` page
- main detail page does not expose this button

**conclusion**: new scraper was necessary. this is not duplication.

---

## what I learned

### lesson: check reuse at mechanism level

the nameservers feature reuses 8 extant mechanisms and extends 1 (selectors). only 2 new mechanisms were created:
- `validateNameserversInput` - unique validation logic
- `getNameserversScraper` - required due to page/semantics difference

### lesson: pattern consistency is reuse

we followed extant patterns (castInto*, validate*) even when we couldn't reuse exact code. this is still consistency.

---

## conclusion

mechanisms review passes:
- 11 mechanisms examined
- 8 reused directly
- 1 extended (selectors)
- 2 new (validation + scraper) - both justified
- no duplicated functionality found
