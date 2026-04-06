# self-review: has-consistent-mechanisms (r7)

## what I reviewed

I searched the codebase for extant mechanisms that the blueprint's new components might duplicate. I examined each new mechanism against what already exists.

---

## codebase search results

### extant scraper patterns

| scraper | location | what it does |
|---------|----------|--------------|
| `scrapeDomainDetail` | `domainDetail/` | scrapes domain overview (includes nameservers) |
| `scrapeDomainsList` | `domainsList/` | scrapes list of domains |
| `scrapeDnsRecords` | `dnsSettings/` | scrapes DNS records from DNS page |
| `scrapeTransferRequests` | `transfersList/` | scrapes transfer request list |
| `toggleDomainLock` | `domainDetail/` | toggles lock on domain |
| `toggleRenewal` | `domainDetail/` | toggles renewal on domain |
| `requestTransferCode` | `domainDetail/` | requests transfer auth code |

### extant selectors

`domainDetailSelectors.ts` already contains:
```typescript
nameserversSection: '[data-testid="nameservers"], .nameservers-section',
nameserverRow: '[data-testid="nameserver-row"], .nameserver-row',
nameserverValue: '[data-testid="nameserver-value"], .nameserver-value',
editNameserversButton: '[data-testid="edit-nameservers"], button[aria-label*="Edit nameservers"]',
```

### extant domain detail scraper

`scrapeDomainDetail.ts` returns `RawDomainDetail` which includes:
```typescript
interface RawDomainDetail {
  name: string;
  status: string;
  registrar: string | null;
  expirationDate: string | null;
  isLocked: boolean;
  lockReason: string | null;
  nameservers: string[];  // <-- already scrapes nameservers!
}
```

---

## mechanism-by-mechanism analysis

### mechanism 1: `scrapeNameservers`

**blueprint proposes**: new communicator to scrape nameservers from nameserver settings page

**extant code**: `scrapeDomainDetail` already scrapes `nameservers` field from domain overview page

**question**: is this duplication?

**investigation**:
- `scrapeDomainDetail` navigates to `/domains/managed/${domain}` (overview page)
- vision mentions nameserver settings at `/dns/domain-nameservers`
- these are DIFFERENT pages in squarespace UI

**deeper question**: can we reuse `scrapeDomainDetail.nameservers` for get?

**analysis**:
1. the overview page shows nameservers in read-only view
2. the nameserver settings page allows edits
3. for `getNameservers`, we only need to READ current state
4. `scrapeDomainDetail` already provides this data

**found item**: `scrapeNameservers` may duplicate `scrapeDomainDetail` for the GET use case!

**recommendation**: consider whether `getNameservers` can reuse `scrapeDomainDetail` instead of a new `scrapeNameservers`. the new scraper would only be needed if:
- nameserver settings page has different/more detailed info
- we need to be on that page anyway for `setNameserversScraper`

**verdict**: POTENTIAL DUPLICATION — needs clarification in blueprint.

---

### mechanism 2: `setNameserversScraper`

**blueprint proposes**: new communicator to set nameservers via browser automation

**extant patterns**: `toggleDomainLock`, `toggleRenewal`, `requestTransferCode`

**question**: does extant code already set nameservers?

**investigation**: no extant code sets nameservers. this is a new capability.

**question**: does this follow extant patterns?

**examination of pattern**:
| aspect | extant pattern | blueprint |
|--------|---------------|-----------|
| navigation | `navigateAndAssertUrl` | ✓ reuses |
| wait for render | `waitForSquarespaceReactRender` | ✓ reuses |
| reauth handle | `handleReauthentication` | ✓ reuses |
| confirm dialogs | custom per operation | ✓ new for this operation |
| verify change | read back state | ✓ planned |

**verdict**: consistent with extant patterns. no duplication.

---

### mechanism 3: `castIntoDeclaredSquarespaceDomainNameservers`

**blueprint proposes**: new transformer to cast raw data into domain object

**extant patterns**:
- `castIntoDeclaredSquarespaceDomainRegistration`
- `castIntoDeclaredSquarespaceDomainDnsRecord`
- `castIntoDeclaredSquarespaceDomainTransferRequest`

**question**: does extant cast handle nameservers?

**investigation**: `castIntoDeclaredSquarespaceDomainRegistration` produces `DeclaredSquarespaceDomainRegistration` which does NOT include nameservers as a field (separate entity per vision).

**verdict**: consistent with extant patterns. no duplication.

---

### mechanism 4: `validateNameserversInput`

**blueprint proposes**: new transformer for input validation

**extant patterns**: no extant validation transformers found (validation is often inline)

**question**: should this be inline instead?

**analysis**: vision edgecases explicitly require validation (min 2, max 13, FQDN format). separate transformer enables unit test. consistent with `rule.require.single-responsibility`.

**verdict**: new pattern but justified. not duplication.

---

### mechanism 5: `DeclaredSquarespaceDomainNameserversDao`

**blueprint proposes**: new DAO via `genDeclastructDao`

**extant patterns**:
- `DeclaredSquarespaceDomainRegistrationDao`
- `DeclaredSquarespaceDomainDnsRecordDao`
- `DeclaredSquarespaceDomainTransferRequestDao`

**verdict**: consistent with extant patterns. no duplication.

---

### mechanism 6: selectors update

**blueprint proposes**: update `domainDetailSelectors.ts`

**extant code**: already has some nameserver selectors

**question**: what new selectors are needed?

blueprint mentions:
- `nameserverSection` — EXTANT
- `customNameserverInputs` — NEW (for edit inputs)
- `saveNameserversButton` — NEW (for save action)
- `useSquarespaceNameserversButton` — NEW (for reset to default)

**verdict**: adds only NEW selectors for edit functionality. no duplication — extant selectors are for read-only view.

---

## summary of found items

| mechanism | status | notes |
|-----------|--------|-------|
| `scrapeNameservers` | POTENTIAL DUPLICATION | may overlap with `scrapeDomainDetail.nameservers` |
| `setNameserversScraper` | consistent | follows extant toggle patterns |
| `castInto...` | consistent | follows extant cast patterns |
| `validateNameserversInput` | new pattern | justified by testability |
| `DAO` | consistent | follows extant DAO patterns |
| selectors | consistent | adds only new edit selectors |

---

## resolution for potential duplication

### option A: reuse `scrapeDomainDetail` for get

`getNameservers` could call `scrapeDomainDetail` and extract `.nameservers`:

```typescript
const getNameservers = async (input, context) => {
  const rawDetail = await scrapeDomainDetail({ page, domain: input.by.unique.domain.name });
  return castIntoDeclaredSquarespaceDomainNameservers({
    domain: input.by.unique.domain.name,
    nameservers: rawDetail.nameservers.length ? rawDetail.nameservers : null,
  });
};
```

**pros**: reuses extant code, no new scraper for read
**cons**: `scrapeDomainDetail` navigates to overview page, not nameserver settings page

### option B: keep separate `scrapeNameservers`

**pros**: navigates directly to nameserver settings page (may be needed for `setNameserversScraper` anyway)
**cons**: new scraper when extant code already reads nameservers

### recommendation

**defer to implementation phase**. in implementation, determine:
1. whether `setNameserversScraper` needs to navigate to nameserver settings page
2. if yes, `scrapeNameservers` should navigate there too (consistency)
3. if no, reuse `scrapeDomainDetail` for get

this is not a blocker duplication — it's an implementation detail that can be resolved when we write code.

---

## what I learned

### lesson 1: search before new scrapers

`scrapeDomainDetail` already scrapes nameservers. I should have noticed this in research phase.

### lesson 2: read-only vs edit pages differ

squarespace has overview pages (read) and settings pages (edit). the same data may appear on both.

### lesson 3: potential duplication is not always a blocker

the duplication is in READ functionality. the SET functionality is definitely new. implementation can decide whether to reuse or create new.

---

## conclusion

consistent-mechanisms review passes with 1 noted item:
- 5 mechanisms follow extant patterns
- 1 mechanism (`scrapeNameservers`) has potential overlap with `scrapeDomainDetail`
- overlap is not a blocker — defer to implementation phase
- no actual duplication of functionality (SET is new, GET may be optimizable)
