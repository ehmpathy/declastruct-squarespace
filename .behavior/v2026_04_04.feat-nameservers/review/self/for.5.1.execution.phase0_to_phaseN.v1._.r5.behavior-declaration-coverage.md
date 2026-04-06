# self-review: behavior-declaration-coverage (r5)

## what I verified

line-by-line code review against vision, blackbox criteria, and blueprint.

---

## vision coverage — line-by-line

### vision requirement 1: DeclaredSquarespaceDomainNameservers entity

**requirement**: domain object with `domain: RefByUnique<...>` and `nameservers: string[] | null`

**code evidence** from `DeclaredSquarespaceDomainNameservers.ts`:

```typescript
// line 10-22
export interface DeclaredSquarespaceDomainNameservers {
  domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>;  // line 14
  nameservers: string[] | null;  // line 21
}

// line 24-29
export class DeclaredSquarespaceDomainNameservers extends DomainEntity<...> {
  public static primary = ['domain'] as const;
  public static unique = ['domain'] as const;
  public static metadata = [] as const;
  public static nested = { domain: DomainLiteral };
}
```

**verdict**: SATISFIED — interface has exact properties, class extends DomainEntity

---

### vision requirement 2: DAO via genDeclastructDao

**requirement**: `get.one.byUnique`, `set.findsert`, `set.upsert`, `set.delete: null`

**code evidence** from `DeclaredSquarespaceDomainNameserversDao.ts`:

```typescript
// line 12-43
export const DeclaredSquarespaceDomainNameserversDao = genDeclastructDao<...>({
  dobj: DeclaredSquarespaceDomainNameservers,
  get: {
    one: {
      byUnique: async (input, context) =>
        getNameservers({ by: { unique: input } }, context),  // line 19-20
      byPrimary: null,  // line 21
    },
  },
  set: {
    findsert: async (input, context) =>
      setNameservers({ findsert: input }, context),  // line 29-30
    upsert: async (input, context) =>
      setNameservers({ upsert: input }, context),  // line 35-36
    delete: null,  // line 41
  },
});
```

**verdict**: SATISFIED — all methods present, delete is null as specified

---

### vision requirement 3: setNameservers operations

**requirement**: upsert with custom nameservers, upsert with null for reset

**code evidence** from `setNameservers.ts`:

```typescript
// line 15-18 — input type supports both
type SetNameserversInput = PickOne<{
  findsert: DeclaredSquarespaceDomainNameservers;
  upsert: DeclaredSquarespaceDomainNameservers;
}>;

// line 32-35 — validates input
const nameserversValidated = validateNameserversInput({
  nameservers: desired.nameservers,
});

// line 53-58 — calls scraper
const result = await setNameserversScraper({
  page,
  domain: desired.domain.name,
  nameservers: nameserversValidated,  // null or array
  credentials: agentOptions.credentials,
});
```

**scraper evidence** from `setNameserversScraper.ts`:

```typescript
// line 44-87 — handles null (reset to squarespace)
if (nameservers === null) {
  const resetButton = page.locator(...).first();
  // clicks "USE SQUARESPACE NAMESERVERS" button
  await resetButton.click();
  // handles confirmation dialog
}

// line 88-168 — handles custom nameservers
else {
  // opens modal, fills inputs, saves
  await editButton.click();
  for (let i = 0; i < nameservers.length; i++) {
    await nsInput.fill(nameservers[i]!);
  }
  await saveButton.click();
}
```

**verdict**: SATISFIED — both upsert paths implemented

---

### vision requirement 4: getNameservers operation

**requirement**: retrieve current nameserver configuration

**code evidence** from `getNameservers.ts`:

```typescript
// line 46-48
export const getNameservers = withNewLoggedInBrowserPage(
  getNameserversFromPage,
);

// line 27-31 — calls scraper
const result = await getNameserversScraper({
  page,
  domain: domainName,
});

// line 34-39 — returns domain object
return new DeclaredSquarespaceDomainNameservers({
  domain: RefByUnique.as<...>({ name: domainName }),
  nameservers: result.nameservers,  // null or array
});
```

**verdict**: SATISFIED — returns DeclaredSquarespaceDomainNameservers

---

### vision requirement 5: null semantics

**requirement**: null = squarespace default, [...] = custom

**code evidence** from `DeclaredSquarespaceDomainNameservers.ts`:

```typescript
// line 17-20 — JSDoc documents semantics
/**
 * .note - null = squarespace default nameservers, [...] = custom nameservers
 */
nameservers: string[] | null;
```

**code evidence** from `getNameserversScraper.ts`:

```typescript
// line 37-45 — button visibility determines null vs array
const resetButtonVisible = await page
  .locator(domainDetailSelectors.useSquarespaceNameserversButton)
  .first()
  .isVisible();
const isSquarespaceDefault = !resetButtonVisible;

// line 47-52 — returns null for squarespace default
if (isSquarespaceDefault) {
  return { nameservers: null };
}
```

**verdict**: SATISFIED — semantics documented and implemented via button check

---

### vision requirement 6: empty array normalization

**requirement**: `[]` treated as `null`

**code evidence** from `validateNameserversInput.ts`:

```typescript
// line 26-27
// empty array treated as null
if (input.nameservers.length === 0) return null;
```

**verdict**: SATISFIED — empty array returns null

---

## blackbox criteria coverage — line-by-line

### usecase.1 = get nameservers

| criterion | line evidence |
|-----------|---------------|
| default NS returns null | `getNameserversScraper.ts:48-51` — `if (isSquarespaceDefault) return { nameservers: null }` |
| custom NS returns array | `getNameserversScraper.ts:54-65` — loops over nameserverRows, returns array |

---

### usecase.2 = set custom nameservers

| criterion | line evidence |
|-----------|---------------|
| upsert to custom works | `setNameserversScraper.ts:88-168` — opens modal, fills inputs, saves |
| idempotent | `setNameservers.ts:38-50` — compares serialized state, skips if unchanged |
| can switch providers | same path — fills new values in inputs |

---

### usecase.3 = reset to squarespace default

| criterion | line evidence |
|-----------|---------------|
| upsert null resets | `setNameserversScraper.ts:44-87` — clicks "USE SQUARESPACE NAMESERVERS" |
| idempotent | `setNameserversScraper.ts:81-87` — checks button visibility, skips if already default |
| no-op when default | `setNameservers.ts:48-50` — returns current if no change needed |

---

### usecase.4 = validation edgecases

| criterion | line evidence |
|-----------|---------------|
| < 2 NS fails | `validateNameserversInput.ts:30-35` — `throw BadRequestError('minimum 2 nameservers required')` |
| invalid FQDN fails | `validateNameserversInput.ts:46-52` — `throw BadRequestError('invalid nameserver format')` |
| empty array to null | `validateNameserversInput.ts:26-27` — `if (length === 0) return null` |

---

### usecase.5 = findsert semantics

| criterion | line evidence |
|-----------|---------------|
| creates when absent | `setNameservers.ts:53-72` — calls scraper, returns new entity |
| returns extant unchanged | `setNameservers.ts:43-45` — `if (input.findsert && noChangeNeeded) return currentNameservers` |

---

## blueprint criteria coverage — line-by-line

### subcomponent contracts

| contract | evidence |
|----------|----------|
| DeclaredSquarespaceDomainNameservers extends DomainEntity | `DeclaredSquarespaceDomainNameservers.ts:24` |
| domain: RefByUnique | `DeclaredSquarespaceDomainNameservers.ts:14` |
| nameservers: string[] \| null | `DeclaredSquarespaceDomainNameservers.ts:21` |
| getNameservers returns entity | `getNameservers.ts:34-39` |
| setNameservers supports findsert/upsert | `setNameservers.ts:15-18` |
| validates min 2 NS | `validateNameserversInput.ts:30-35` |
| validates FQDN format | `validateNameserversInput.ts:46-52` |
| treats empty as null | `validateNameserversInput.ts:26-27` |
| DAO.get.one.byUnique | `DeclaredSquarespaceDomainNameserversDao.ts:19-20` |
| DAO.set.findsert | `DeclaredSquarespaceDomainNameserversDao.ts:29-30` |
| DAO.set.upsert | `DeclaredSquarespaceDomainNameserversDao.ts:35-36` |
| DAO.set.delete is null | `DeclaredSquarespaceDomainNameserversDao.ts:41` |

---

### composition boundaries

| boundary | evidence |
|----------|----------|
| domain object in src/domain.objects/ | `src/domain.objects/DeclaredSquarespaceDomainNameservers.ts` exists |
| DAO in src/access/daos/ | `src/access/daos/DeclaredSquarespaceDomainNameserversDao.ts` exists |
| operations in src/domain.operations/ | `src/domain.operations/domainNameservers/` folder exists |
| scraper in SDK | `src/access/sdks/squarespace.via.playwright/domainNameservers/` folder exists |

---

## deviation from blueprint

### getNameserversScraper.ts

**blueprint said**: GET reuses extant `scrapeDomainDetail`

**implementation**: created separate `getNameserversScraper.ts`

**reason per r4**: `scrapeDomainDetail` returns `nameservers: string[]` (always array). we need `nameservers: string[] | null` to distinguish squarespace default from custom. the button visibility check (`useSquarespaceNameserversButton`) is only available on the nameservers page.

**code evidence** from `getNameserversScraper.ts:41-45`:
```typescript
const resetButtonVisible = await page
  .locator(domainDetailSelectors.useSquarespaceNameserversButton)
  .first()
  .isVisible();
const isSquarespaceDefault = !resetButtonVisible;
```

this logic cannot be implemented via `scrapeDomainDetail` because:
1. different page URL (`/dns/domain-nameservers` vs main detail)
2. button only visible on nameservers page
3. `scrapeDomainDetail` always returns array, cannot return null

**verdict**: JUSTIFIED deviation

---

## summary

| category | status |
|----------|--------|
| vision requirements | 6/6 satisfied with line evidence |
| blackbox usecases | 5/5 satisfied with line evidence |
| blueprint contracts | all satisfied with line evidence |
| composition boundaries | all files in correct locations |
| deviation | 1 justified (getNameserversScraper) |

---

## conclusion

behavior declaration coverage verified via line-by-line code review:
- every vision requirement maps to specific code lines
- every blackbox criterion maps to specific implementation
- every blueprint contract is implemented
- the one deviation (separate scraper) is justified by null semantics requirement
