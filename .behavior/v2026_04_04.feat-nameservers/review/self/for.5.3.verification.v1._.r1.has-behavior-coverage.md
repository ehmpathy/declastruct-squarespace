# self-review: has-behavior-coverage

## wish behaviors

| behavior from wish | test coverage | verified |
|--------------------|---------------|----------|
| change domain nameservers to cloudflare | `setNameservers.play.integration.test.ts` [t1] upsert to cloudflare | YES |
| swap to | `setNameserversScraper.integration.test.ts` + play test | YES |
| swap back | `setNameservers.play.integration.test.ts` [t3] upsert back to null | YES |
| new resource (domain object) | `DeclaredSquarespaceDomainNameservers` entity created | YES |
| full test coverage | 25 tests across 4 test files | YES |
| DAO | `DeclaredSquarespaceDomainNameserversDao.integration.test.ts` | YES |

## vision behaviors

| behavior from vision | test coverage | verified |
|----------------------|---------------|----------|
| `DeclaredSquarespaceDomainNameservers` domain object | created in `src/domain.objects/` | YES |
| `getNameservers` operation | `getNameservers.integration.test.ts` (4 tests) | YES |
| `setNameservers` with upsert | `setNameservers.play.integration.test.ts` (11 tests) | YES |
| `setNameservers` with findsert | play test case 3, DAO test | YES |
| swap to cloudflare (`nameservers: [...]`) | play test [t1], [t2] | YES |
| swap back to squarespace (`nameservers: null`) | play test [t3], [t4] | YES |
| DAO via `genDeclastructDao` | `DeclaredSquarespaceDomainNameserversDao` (6 tests) | YES |
| idempotent operations | play test case 2 (same values upsert) | YES |
| scraper for nameserver changes | `setNameserversScraper.integration.test.ts` (4 tests) | YES |

## test files in checklist

| test file | location | exists |
|-----------|----------|--------|
| `setNameservers.play.integration.test.ts` | `src/domain.operations/domainNameservers/` | YES |
| `DeclaredSquarespaceDomainNameserversDao.integration.test.ts` | `src/access/daos/` | YES |
| `setNameserversScraper.integration.test.ts` | `src/access/sdks/squarespace.via.playwright/domainNameservers/` | YES |
| `getNameservers.integration.test.ts` | `src/domain.operations/domainNameservers/` | YES |

## articulation: why each behavior holds

### swap to cloudflare
the journey test `setNameservers.play.integration.test.ts` case 1 explicitly tests swap from squarespace default to cloudflare nameservers. the test:
1. starts with a domain at squarespace default (`nameservers: null`)
2. calls `setNameservers({ upsert: { domain, nameservers: CLOUDFLARE_NS } })`
3. verifies the returned entity has `nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com']`
4. confirms via `getNameservers` that the change persisted

this directly exercises the core wish: "change the domain nameservers to cloudflare".

### swap back to squarespace
the same journey test continues by swap back:
1. after cloudflare is set, calls `setNameservers({ upsert: { domain, nameservers: null } })`
2. verifies the returned entity has `nameservers: null`
3. confirms via `getNameservers` that the reset persisted

this covers "gotta support swap to and swap back" from the wish.

### new resource (domain object)
`DeclaredSquarespaceDomainNameservers` is a proper domain entity with:
- `domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>` — typed reference
- `nameservers: string[] | null` — semantic null for squarespace default
- unique key on `[domain.name]` for idempotent operations

this follows the pattern of `DeclaredSquarespaceDomainDnsRecord` and satisfies "add a new resource".

### DAO with test coverage
`DeclaredSquarespaceDomainNameserversDao` created via `genDeclastructDao` with 6 integration tests that cover:
- `get.one.byUnique`: retrieves nameserver config for a domain
- `set.findsert`: creates only if absent, returns extant if present
- `set.upsert`: always writes the desired state

the DAO tests prove declarative management works "just like the others".

### idempotent operations
journey test case 2 explicitly tests idempotency:
1. sets cloudflare nameservers
2. calls upsert again with the same values
3. verifies the result is unchanged
4. confirms no error and nameservers remain the same

this ensures repeat operations are safe.

### findsert semantics
journey test case 3 tests findsert:
1. gets current state
2. calls findsert with same state
3. verifies extant entity returned unchanged
4. confirms operation is fast (no UI interaction when no change needed)

this proves findsert semantics work correctly.

## conclusion

every behavior from the wish ("change nameservers to cloudflare", "swap to and swap back", "new resource with test coverage and DAO") and vision (domain object, get/set operations, DAO, idempotent operations, scraper) has test coverage. the 25 tests across 4 test files exercise every path.

**holds**: all behaviors have test coverage.
