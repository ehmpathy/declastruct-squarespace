# self-review: has-vision-coverage

## artifacts reviewed
- `.behavior/v2026_04_04.feat-nameservers/0.wish.md`
- `.behavior/v2026_04_04.feat-nameservers/1.vision.md` (from system context)
- `.behavior/v2026_04_04.feat-nameservers/5.5.playtest.v1.i1.md`

## coverage matrix

### wish coverage

| wish requirement | playtest step |
|------------------|---------------|
| change nameservers to cloudflare | happy path #1: swap nameservers to cloudflare |
| support swap to | happy path #1 |
| support swap back | happy path #3: swap nameservers back to squarespace default |

**holds.** both swap directions are covered.

### vision usecases coverage

| vision usecase | playtest step |
|----------------|---------------|
| usecase.1: migrate to cloudflare | happy path #1 |
| usecase.2: migrate back to squarespace | happy path #3 |
| usecase.3: audit DNS providers | covered by verify steps #2, #4 (getNameservers) |

**holds.** all usecases have dedicated steps.

### contract coverage

| contract | playtest step |
|----------|---------------|
| `getNameservers({ by: { unique } })` | happy paths #2, #4 |
| `setNameservers({ upsert })` to cloudflare | happy path #1 |
| `setNameservers({ upsert })` to null | happy path #3 |
| `setNameservers({ findsert })` | happy path #6 |
| idempotency | happy path #5 |
| declastruct CLI workflow | happy path #7 |

**holds.** all contracts are exercised.

### validation edgecases coverage

| edgecase | playtest step |
|----------|---------------|
| fewer than 2 nameservers | edgey path #e1 |
| invalid FQDN format | edgey path #e2 |
| more than 13 nameservers | edgey path #e3 |
| CLI invalid plan file | edgey path #e4 |
| CLI invalid resources path | edgey path #e5 |
| CLI malformed resources | edgey path #e6 |

**holds.** all edge cases from vision have playtest coverage.

## issues found

none. all behaviors from wish and vision are covered by playtest steps.

## why it holds

### wish coverage holds

the wish explicitly states two requirements:
1. "change the domain nameservers to cloudflare" → playtest step #1 directly tests this with cloudflare NS values
2. "gotta support swap to and swap back" → playtest steps #1 and #3 test both directions

### vision coverage holds

the vision defines three usecases:
1. **migrate to cloudflare** — the core use case. playtest step #1 runs `setNameservers` with cloudflare values and step #2 verifies via `getNameservers`.
2. **migrate back to squarespace** — the reverse operation. playtest step #3 runs `setNameservers` with `null` and step #4 verifies the reset.
3. **audit DNS providers** — the read operation. steps #2 and #4 exercise `getNameservers` which is how users would audit which provider a domain uses.

### contract coverage holds

every contract mentioned in the vision has a matched playtest step:
- `getNameservers({ by: { unique } })` — steps #2 and #4
- `setNameservers({ upsert })` — steps #1, #3, #5
- `setNameservers({ findsert })` — step #6
- `DeclaredSquarespaceDomainNameserversDao` — step #7 (CLI workflow uses the DAO internally)

### validation edgecase coverage holds

the vision mentions these edgecases:
- "require at least 2 nameservers" → edgey path #e1
- "validate FQDN format" → edgey path #e2
- "maximum 13 nameservers (RFC 1035)" → edgey path #e3

all three are covered with explicit test steps.

## reflection

i read through the wish and vision carefully and mapped each requirement to a playtest step. the coverage is complete — no requirements are left untested. the playtest follows the journey a user would take: swap to cloudflare, verify, swap back, verify. edge cases ensure the system fails gracefully with clear error messages.
