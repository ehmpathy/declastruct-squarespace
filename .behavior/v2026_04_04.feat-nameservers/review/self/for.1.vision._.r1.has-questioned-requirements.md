# self-review: has-questioned-requirements

## requirements questioned

### 1. separate entity `DeclaredSquarespaceDomainNameservers`

**who said this?** the wisher explicitly: "not on registration. DeclaredSquarespaceDomainDnsNameservers instead" then "or just DomainNameservers" then "DeclaredSquarespaceDomainNameservers"

**what evidence supports it?** direct instruction from wisher. also follows pattern consistency with `DeclaredSquarespaceDomainDnsRecord`.

**what if we didn't?** add `nameservers: string[] | null` attribute to `DeclaredSquarespaceDomainRegistration` instead. simpler, but wisher explicitly rejected this approach.

**verdict: NON-ISSUE** — wisher explicitly requested separate entity.

**why it holds:** wisher gave explicit direction. separate entity maintains clean separation of concerns — nameserver config is not domain registration metadata.

---

### 2. `provider` enum ('SQUARESPACE' | 'CUSTOM')

**who said this?** i did, to make state explicit.

**what evidence supports it?** none — the wish doesn't mention a provider enum.

**what if we didn't?** derive provider from nameservers value:
- `null` → squarespace default
- `['ns1.cloudflare.com', ...]` → custom

**verdict: ISSUE FOUND** — redundant field. remove `provider`, use `nameservers: string[] | null` where null = squarespace default.

**how fixed:** removed `provider` enum from vision. the `nameservers` value itself determines the provider: null = squarespace, non-null array = custom.

---

### 3. separate `getNameservers` / `setNameservers` operations

**who said this?** natural consequence of separate entity pattern.

**what evidence supports it?** declastruct pattern requires get/set operations per entity.

**verdict: NON-ISSUE** — required by design pattern.

**why it holds:** separate entity requires separate operations. follows `getDnsRecord` / `setDnsRecord` pattern.

---

### 4. batch operations across 100+ domains

**who said this?** i did, extrapolated value from wish.

**what evidence supports it?** reasonable usecase, but not in the wish.

**what if we didn't?** still achieves core goal. batch is just a loop on top of single-domain operations.

**verdict: NON-ISSUE** — this is a natural consequence of declarative control, not a separate requirement.

**why it holds:** batch operations are trivially achievable via loop over `setNameservers`. no special batch API needed. this is a usecase, not a requirement.

---

### 5. full test coverage

**who said this?** the wish explicitly: "gotta add a new resource to support that with full test coverage and dao and etc"

**verdict: NON-ISSUE** — directly from wisher.

**why it holds:** the wisher explicitly requested full test coverage. this is a core requirement, not my extrapolation.

---

### 6. support swap to and swap back

**who said this?** the wish explicitly: "gotta support swap to and swap back"

**verdict: NON-ISSUE** — directly from wisher.

**why it holds:** the wisher explicitly requested bidirectional capability. swap to custom nameservers (cloudflare) and swap back to squarespace default. this is a core requirement.

---

## summary

| requirement | source | verdict | action |
|-------------|--------|---------|--------|
| separate entity | wisher | non-issue | keep, per explicit direction |
| provider enum | me | issue | removed, derive from value |
| separate get/set ops | pattern | non-issue | keep, required by entity pattern |
| batch operations | me | non-issue | usecase, not requirement |
| full test coverage | wisher | non-issue | keep |
| swap to/back | wisher | non-issue | keep |

---

## the scope

- new entity `DeclaredSquarespaceDomainNameservers`
- new DAO `DeclaredSquarespaceDomainNameserversDao` via `genDeclastructDao`
- new operations `getNameservers`, `setNameservers`
- `nameservers: string[] | null` — null = squarespace default, [...] = custom
- domain reference via `RefByUnique<typeof DeclaredSquarespaceDomainRegistration>`

follows extant patterns: separate entity with DAO and get/set operations, just like DomainRegistration.
