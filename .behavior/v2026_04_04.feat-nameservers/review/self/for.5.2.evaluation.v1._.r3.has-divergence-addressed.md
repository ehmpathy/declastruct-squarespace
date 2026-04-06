# self-review: has-divergence-addressed (r3)

## review approach

read the actual code. compare blueprint assumption vs implementation reality. trace each divergence to concrete lines.

---

## divergence 1: GET uses separate scraper instead of scrapeDomainDetail

### blueprint assumption

blueprint line 63: `[←] scrapeDomainDetail (reuse — already scrapes nameservers)`

the blueprint assumed scrapeDomainDetail could be reused for GET.

### implementation reality

**scrapeDomainDetail.ts:**
- line 17: `nameservers: string[]` — return type has no null
- line 32: operates on `/domains/managed/${domain}` page
- line 51: explicitly excludes `/dns` paths: `currentUrl.includes('/dns')`
- lines 90-97: just reads elements, no button visibility check

**getNameserversScraper.ts:**
- line 17: `nameservers: string[] | null` — return type supports null
- line 20: operates on `/domains/managed/${domain}/dns/domain-nameservers`
- lines 41-45: uses button visibility to detect squarespace default
- lines 47-51: returns `null` when button is not visible

### why scrapeDomainDetail cannot work

1. **wrong page**: scrapeDomainDetail operates on `/domains/managed/{domain}`, getNameserversScraper operates on `/dns/domain-nameservers`
2. **wrong return type**: scrapeDomainDetail returns `string[]`, getNameserversScraper returns `string[] | null`
3. **no detection mechanism**: scrapeDomainDetail just reads values, it cannot distinguish squarespace default from custom

### could we modify scrapeDomainDetail instead?

**what it would require:**
1. change return type from `string[]` to `string[] | null`
2. add navigation to `/dns/domain-nameservers` page
3. add button visibility detection

**why this is worse:**
1. scrapeDomainDetail explicitly excludes `/dns` paths (line 51) — this is intentional
2. change to return type would require updates to all callers
3. scrapeDomainDetail's purpose is domain detail, not nameserver detection
4. DNS navigation would violate single responsibility

### verdict

the divergence is justified. the code evidence is:
- scrapeDomainDetail line 17 vs getNameserversScraper line 17 (type difference)
- scrapeDomainDetail line 51 vs getNameserversScraper line 20 (page difference)
- getNameserversScraper lines 41-45 (detection mechanism that doesn't exist in scrapeDomainDetail)

---

## divergence 2: validateNameserversInput.ts not in blueprint filediff tree

### blueprint evidence

- filediff tree: not listed
- codepath tree line 68: `[+] validateNameserversInput (new transformer)`
- test coverage line 114: `validateNameserversInput.test.ts | min 2, max 13, FQDN format, empty to null`

### why this is not a code divergence

the blueprint codepath tree and test coverage sections both mention validateNameserversInput. only the filediff tree omitted it. the filediff tree is a summary derived from the codepath tree — the omission was a documentation gap, the file entry was absent from one section.

### verdict

non-issue. the operation was always planned, the file entry was just absent from the filediff.

---

## divergence 3: getNameserversScraper.ts not in blueprint filediff tree

### chain of causation

1. blueprint assumed scrapeDomainDetail could detect null
2. scrapeDomainDetail cannot detect null (returns `string[]`, no button check)
3. null detection requires button visibility check on nameservers page
4. therefore separate scraper is needed
5. therefore new file is needed

### verdict

direct consequence of divergence 1. once the GET divergence is justified, this file is required.

---

## skeptic's final challenge

**"could this divergence cause problems later?"**

| risk | assessment |
|------|------------|
| maintenance burden | two scrapers instead of one, but they operate on different pages with different purposes |
| drift risk | if squarespace changes nameservers page, only getNameserversScraper needs update |
| type safety | getNameserversScraper has correct type (`string[] \| null`), scrapeDomainDetail keeps simple type (`string[]`) |

the divergence actually improves maintainability via concern separation.

---

## issues found

none. all divergences are properly addressed:
- divergence 1: justified by concrete code evidence (different pages, different types, different detection)
- divergence 2: documentation gap, not code divergence
- divergence 3: direct consequence of divergence 1

---

## why it holds

1. **code evidence supports the divergence**: scrapeDomainDetail cannot return null (line 17), operates on wrong page (line 32, 51), lacks detection mechanism
2. **the divergence is not laziness**: modification would require changes to extant callers, violate single responsibility, add complexity
3. **separation is cleaner**: nameserver detection has unique requirements (button visibility, null semantics) that don't belong in scrapeDomainDetail
4. **documentation gaps are not code gaps**: validateNameserversInput was in codepath+test, getNameserversScraper follows from divergence 1

the divergence analysis is complete with concrete code references. a reviewer who reads scrapeDomainDetail.ts and getNameserversScraper.ts will find the same evidence.

