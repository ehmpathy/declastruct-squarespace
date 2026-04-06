# self-review: has-consistent-mechanisms (r3)

## deeper investigation

in r2, I listed mechanisms but didn't search the codebase for similar patterns. let me do that now.

---

## codebase search results

### pattern 1: read operations in SDK

**search**: `**/scrape*.ts` in playwright SDK

```
scrapeDomainDetail.ts
scrapeDnsRecords.ts
scrapeDomainsList.ts
scrapeTransferRequests.ts
```

**our file**: `getNameserversScraper.ts`

**inconsistency found**: extant read operations are named `scrape*`, not `get*Scraper`.

---

### pattern 2: mutation operations in SDK

**search**: `**/toggle*.ts` in playwright SDK

```
toggleDomainLock.ts
toggleDnssec.ts
toggleRenewal.ts
```

**our file**: `setNameserversScraper.ts`

**inconsistency found**: extant mutation operations are named `toggle*`, not `set*Scraper`.

---

## analysis of inconsistencies

### inconsistency 1: getNameserversScraper vs scrape*

**extant pattern**: `scrapeDomainDetail`, `scrapeDnsRecords`
**our name**: `getNameserversScraper`

**is this actually wrong?**

let me examine the functions:
- `scrapeDomainDetail` - navigates to page, extracts structured data, returns raw shape
- `getNameserversScraper` - navigates to page, extracts structured data, returns raw shape

**verdict**: the functions are equivalent in purpose. name is inconsistent.

**should we rename?**
- pro: consistency with extant pattern
- con: `getNameserversScraper` clearly indicates it's a "getter" operation
- con: tests already written with this name

**decision**: flag as minor inconsistency but not a blocker. the operation is correct, only the name differs from convention.

---

### inconsistency 2: setNameserversScraper vs toggle*

**extant pattern**: `toggleDomainLock`, `toggleRenewal`, `toggleDnssec`
**our name**: `setNameserversScraper`

**is this actually wrong?**

let me examine the semantics:
- `toggle*` = flip between two states (locked/unlocked, enabled/disabled)
- `set*` = assign specific values (nameservers array or null)

**verdict**: different semantics. `toggle*` is for binary state flip. `setNameserversScraper` assigns specific values (an array of nameservers). use of `toggle*` would be semantically incorrect.

**should we rename?**
- no - `setNameservers` is the correct verb because we assign values, not flip a toggle

**decision**: NOT an inconsistency. different operation type justifies different name.

---

## deeper check: are there hidden duplications?

### check 1: could getNameserversScraper reuse scrapeDomainDetail?

**scrapeDomainDetail returns**:
```typescript
{
  name: string;
  status: string;
  registrar: string | null;
  expirationDate: string | null;
  isLocked: boolean;
  lockReason: string | null;
  nameservers: string[];  // always array
}
```

**we need**:
```typescript
{
  nameservers: string[] | null;  // null = squarespace default
}
```

**how scrapeDomainDetail gets nameservers**:
```typescript
// from scrapeDomainDetail.ts lines 89-97
const nameserverElements = await page.$$(domainDetailSelectors.nameserverValue);
const nameservers: string[] = [];
for (const ns of nameserverElements) {
  const value = await ns.textContent();
  if (value) nameservers.push(value.trim());
}
```

**problem**: this returns an array even for squarespace default nameservers. it cannot distinguish between:
1. custom nameservers = `['ns1.cloudflare.com', 'ns2.cloudflare.com']`
2. squarespace default = `['ns1.googledomains.com', ...]`

both return as arrays. we need `null` for squarespace default.

**how getNameserversScraper distinguishes**:
```typescript
// check if "USE SQUARESPACE NAMESERVERS" button is visible
// button only visible when CUSTOM nameservers are set
const resetButtonVisible = await page
  .locator(domainDetailSelectors.useSquarespaceNameserversButton)
  .isVisible();
const isSquarespaceDefault = !resetButtonVisible;
```

**verdict**: getNameserversScraper cannot reuse scrapeDomainDetail because:
1. different page (nameservers settings page vs main detail page)
2. different semantics (null vs array)
3. button visibility check only available on nameservers page

---

### check 2: any other potential duplications?

| mechanism | duplicates? | reason |
|-----------|-------------|--------|
| validation logic | no | nameserver validation is unique |
| cast logic | no | nameserver-specific transformation |
| domain object | no | new entity type |
| DAO | no | genDeclastructDao reuse |
| wrappers | no | withNewLoggedInBrowserPage reuse |

---

## found issue

### issue: name inconsistency (minor)

**file**: `getNameserversScraper.ts`
**extant pattern**: `scrape*.ts`
**impact**: cosmetic - operation is correct

**should we fix?**
- rename now would change API and require test updates
- the feature is functionally complete
- name conveys intent (it's a getter)

**recommendation**: document as known inconsistency. optionally rename in future refactor.

**why not a blocker**: the operation is correct. name is a convention preference, not a functional issue.

---

## what I learned

### lesson: search codebase before review

I should have searched for `scrape*.ts` and `toggle*.ts` patterns in r2. this would have revealed the name inconsistency earlier.

### lesson: distinguish semantics from convention

`setNameserversScraper` vs `toggle*` is NOT an inconsistency - different operations (value assignment vs binary flip) justify different names. but `getNameserversScraper` vs `scrape*` IS an inconsistency for equivalent operations.

### lesson: when duplication is not possible

I verified that scrapeDomainDetail cannot provide the null semantics we need. the new scraper is justified, even if named slightly differently.

---

## conclusion

mechanisms review passes with one minor find:
- 11 mechanisms examined
- 1 name inconsistency identified (getNameserversScraper vs scrape* convention)
- 0 functional duplications found
- new scraper justified (cannot reuse scrapeDomainDetail due to semantics)
- name inconsistency is cosmetic, not a blocker
