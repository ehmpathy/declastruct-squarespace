# self-review r2: has-edgecase-coverage

## what could go wrong?

| failure mode | playtest coverage | status |
|--------------|-------------------|--------|
| invalid credentials | happy path 1 fail criteria: "authentication error" | covered |
| wrong totp secret | edgey path 1 fail criteria: "totp code rejected" | covered |
| sms 2fa instead of totp | edgey path 1 fail criteria: "sms code required" | covered |
| passkey 2fa | edgey path 1 fail criteria: "passkey required" | covered |
| squarespace ui changed | all happy paths fail criteria: "selector error" | covered |
| session expired mid-batch | implicit in session reuse test | covered |
| domain locked (60-day) | edgey path 3 | covered |
| bot detection / captcha | edgey path 4 | covered |
| empty account (no domains) | happy path 1: would return empty list | partial |
| rate limit triggered | not explicitly tested | gap |

### gap: rate limit

rate limit edge case not explicitly tested because:
1. trigger of rate limits would be destructive to the test account
2. sequential execution with delays (bottleneck) is the mitigation
3. if rate limit occurs, tests would fail with clear error (not silent)

**acceptable gap:** production mitigation exists; explicit test would be harmful.

### gap: empty account

if test account has no domains, happy path 1 would pass but return empty list.

**mitigation in playtest:** pass criteria says "output shows at least one domain" — foreman would know to add a domain if empty.

## what inputs are unusual but valid?

| unusual input | playtest coverage | status |
|---------------|-------------------|--------|
| domain with special chars | depends on test account data | not explicit |
| domain with many dns records | depends on test account data | not explicit |
| domain with no custom dns | happy path 2 handles empty records | covered |
| transfer already requested | manual verification handles idempotent findsert | covered |

**acceptable:** unusual inputs depend on test account composition. tests use real data, so coverage depends on what domains exist.

## are boundaries tested?

| boundary | playtest coverage | status |
|----------|-------------------|--------|
| first domain | happy path 1 (at least one) | covered |
| large batch (300) | implicit via acceptance test pattern | covered implicitly |
| expired session | edgey path 2 (session reuse) | covered |
| locked vs unlocked | edgey path 3 (60-day lock) | covered |

## conclusion

edge cases adequately covered. two gaps documented with rationale:
1. rate limit: mitigation exists, explicit test harmful
2. unusual domains: depends on test account data

no action needed.
