# self-review: has-consistent-mechanisms (r8)

## what I reviewed

I re-examined the r7 find that `scrapeNameservers` potentially duplicated `scrapeDomainDetail.nameservers`. instead of defer to implementation, I fixed the blueprint.

---

## the duplication issue

### r7 found

`scrapeDomainDetail` already scrapes nameservers from the domain overview page:

```typescript
interface RawDomainDetail {
  name: string;
  status: string;
  registrar: string | null;
  expirationDate: string | null;
  isLocked: boolean;
  lockReason: string | null;
  nameservers: string[];  // already present!
}
```

the blueprint proposed a new `scrapeNameservers` that would navigate to `/dns/domain-nameservers` and scrape the same data from a different page.

### why this was duplication

for the GET usecase (read current nameservers), we only need to READ the current state. `scrapeDomainDetail` already provides this data. a new scraper would:

1. navigate to a different page
2. scrape the same information
3. require new integration tests
4. add maintenance burden

---

## the fix

I updated the blueprint to remove `scrapeNameservers` and reuse `scrapeDomainDetail`:

### summary change

```diff
- new scraper functions: `scrapeNameservers`, `setNameserversScraper`
+ new scraper: `setNameserversScraper` (GET reuses extant `scrapeDomainDetail`)
```

### filediff tree change

removed:
- `scrapeNameservers.ts`
- `scrapeNameservers.integration.test.ts`

### codepath tree change

```diff
getNameservers (orchestrator)
├── [+] getNameservers.ts
│   ├── [←] getNewLoggedInBrowserPage (reuse)
-│   ├── [+] scrapeNameservers (new communicator)
+│   ├── [←] scrapeDomainDetail (reuse — already scrapes nameservers)
│   └── [+] castIntoDeclaredSquarespaceDomainNameservers (new transformer)
```

removed the entire `scrapeNameservers (communicator)` section.

### coverage by layer change

removed `scrapeNameservers` row from the table.

### test tree change

removed `scrapeNameservers.ts` and `scrapeNameservers.integration.test.ts`.

### reuse table change

added `scrapeDomainDetail` to the reuse from extant code table.

---

## why setNameserversScraper is not duplication

`setNameserversScraper` MUST navigate to `/dns/domain-nameservers` because:

1. the overview page is read-only
2. nameserver edit functionality is only on the settings page
3. confirmation dialogs, input fields, and save buttons are on the settings page

there is no extant mechanism that sets nameservers. this is genuinely new functionality.

---

## mechanism-by-mechanism verification

I searched the codebase to verify each remaining mechanism is not duplication.

### 1. `DeclaredSquarespaceDomainNameservers` (domain object)

**search**: `grep -r "DeclaredSquarespace.*Nameserver" src/`
**result**: no matches

**verdict**: no extant nameserver domain object. new creation justified.

### 2. `castIntoDeclaredSquarespaceDomainNameservers` (transformer)

**search**: `grep -r "castInto.*Nameserver" src/`
**result**: no matches

**verdict**: no extant nameserver transformer. follows pattern of `castIntoDeclaredSquarespaceDomainDnsRecord`.

### 3. `validateNameserversInput` (transformer)

**search**: `grep -r "validate.*Nameserver\|fqdn" src/`
**result**: no matches

**verdict**: no extant nameserver validator or FQDN validator. new creation justified for testability.

### 4. `setNameserversScraper` (communicator)

**search**: `grep -r "setNameserver\|setNs" src/`
**result**: no matches

**verified**: no extant mechanism that sets nameservers via browser automation. genuinely new.

### 5. `DeclaredSquarespaceDomainNameserversDao` (DAO)

**search**: `grep -r "NameserversDao" src/`
**result**: no matches

**verdict**: no extant nameservers DAO. follows pattern of `DeclaredSquarespaceDomainDnsRecordDao`.

### 6. selectors update

**search**: selectors file at `src/access/sdks/squarespace.via.playwright/selectors/domainDetailSelectors.ts`
**found**: read selectors already exist (`nameserversSection`, `nameserverRow`, `nameserverValue`, `editNameserversButton`)

**verdict**: only need to ADD edit selectors (`customNameserverInputs`, `saveNameserversButton`, `useSquarespaceNameserversButton`). no duplication.

---

## mechanism consistency summary

| mechanism | status | verification |
|-----------|--------|--------------|
| `scrapeDomainDetail` | reuse | provides nameservers for GET |
| `setNameserversScraper` | new | no extant setter, search confirmed |
| `castIntoDeclaredSquarespaceDomainNameservers` | new | no extant cast, follows pattern |
| `validateNameserversInput` | new | no extant validator, justified by testability |
| `DeclaredSquarespaceDomainNameserversDao` | new | no extant DAO, follows pattern |
| selectors | add only | read selectors extant, edit selectors new |

---

## what I learned

### lesson 1: fix, not defer

r7 identified the duplication but deferred to implementation. this was incorrect. the blueprint should be fixed BEFORE implementation, not in implementation.

### lesson 2: search for reuse opportunities

before I create a new scraper, I should search extant scrapers for shared data. `scrapeDomainDetail` already had the data I needed.

### lesson 3: read vs write pages differ

the overview page (read) and settings page (write) serve different purposes. reuse the read page for GET. create new scraper only for SET.

---

## conclusion

consistent-mechanisms review passes after fix:
- 1 duplication found and fixed (removed `scrapeNameservers`)
- `getNameservers` now reuses `scrapeDomainDetail`
- `setNameserversScraper` is genuinely new (write functionality)
- all mechanisms follow extant patterns or are justified new
