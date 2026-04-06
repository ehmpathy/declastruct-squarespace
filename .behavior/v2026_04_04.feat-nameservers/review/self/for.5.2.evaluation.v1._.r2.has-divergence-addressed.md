# self-review: has-divergence-addressed (r2)

## review approach

for each divergence, evaluate: is the resolution valid? would a skeptic accept it?

---

## divergence resolutions

### divergence 1: GET uses separate scraper instead of scrapeDomainDetail

**resolution type:** backup (justified deviation)

**the skeptic's challenge:**
- "is this truly an improvement, or just laziness?"
- "did you just not want to modify scrapeDomainDetail?"

**defense:**

1. **technical necessity, not laziness**
   - scrapeDomainDetail returns `string[]` for nameservers
   - `string[]` cannot distinguish between "squarespace default" and "custom with values"
   - squarespace default must be represented as `null`, not as `[]` or default values
   - the only way to detect squarespace default is via "Use Squarespace Nameservers" button visibility
   - this button exists on `/dns/domain-nameservers` page, not on `/domains/managed/{domain}`
   - scrapeDomainDetail operates on the wrong page

2. **change would affect extant callers**
   - scrapeDomainDetail is used by other operations
   - change from `string[]` to `string[] | null` is type-incompatible
   - would require changes to all callers
   - separate scraper isolates the change to nameservers feature

3. **separation of concerns**
   - nameserver detection has unique requirements (null vs custom)
   - other domain detail scrapes don't need null detection
   - separate scraper keeps concerns isolated

**verdict:** justified. the divergence is a technical requirement, not laziness.

---

### divergence 2: validateNameserversInput.ts not in blueprint filediff tree

**resolution type:** documentation gap (not a code divergence)

**the skeptic's challenge:**
- "why wasn't this in the blueprint?"

**defense:**

1. **the operation was always implied**
   - blueprint codepath tree line 68: `[+] validateNameserversInput (new transformer)`
   - blueprint test coverage line 114: `validateNameserversInput.test.ts | min 2, max 13, FQDN format, empty to null`
   - only the filediff tree omitted the explicit file entry

2. **filediff tree is derivative**
   - filediff tree should be derived from codepath tree
   - codepath tree is the source of truth for what operations exist
   - the omission was a documentation gap in blueprint, not an implementation deviation

**verdict:** non-issue. the file was always part of the design, just not explicitly listed in filediff.

---

### divergence 3: getNameserversScraper.ts not in blueprint filediff tree

**resolution type:** consequence of divergence 1

**the skeptic's challenge:**
- "why is there an extra scraper file?"

**defense:**

1. **follows from divergence 1**
   - once we justified separate GET logic, the scraper file was required
   - this is not an independent divergence
   - it's a consequence of the null detection requirement

2. **documented in evaluation**
   - evaluation notes this as "consequence of the justified deviation for null detection"
   - the chain is clear: null detection → separate scraper → extra file

**verdict:** non-issue. this is a direct consequence of divergence 1, not a separate problem.

---

## could these divergences cause problems later?

| divergence | future risk | mitigation |
|------------|-------------|------------|
| separate GET scraper | maintenance burden (2 scrapers vs 1) | scrapers are simple, well-tested, isolated |
| validateNameserversInput not in filediff | none | documentation gap only |
| getNameserversScraper not in filediff | none | consequence of justified divergence |

the primary risk is slight maintenance burden from an extra scraper. this is acceptable given the technical necessity.

---

## issues found

none. all divergences have valid resolutions:
- divergence 1: justified by technical necessity (null detection)
- divergence 2: documentation gap in blueprint, not code divergence
- divergence 3: direct consequence of divergence 1

---

## why it holds

1. **no lazy backups**: the GET scraper divergence is technical, not avoidance
2. **documentation gaps are not code gaps**: validateNameserversInput was in codepath/test, just not filediff
3. **consequences are traced**: getNameserversScraper follows from the null detection requirement
4. **skeptic satisfied**: each defense addresses a real concern, not a strawman

all divergences are properly addressed. a reviewer who challenges each backup will find the same technical justifications.

