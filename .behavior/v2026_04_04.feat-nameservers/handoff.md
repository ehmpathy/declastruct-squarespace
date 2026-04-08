# handoff: feat-nameservers

## status

**ready for test** — unified `resources.ts` created, needs one more run to verify.

## what's done

### unified transfer-out resources.ts

`provision/usecase.transferout/resources.ts` — single declastruct wish that:
- filters domains by `renewal === 'ENABLED'` AND `expirationDate <= RENEWS_UNTIL`
- declares target state for each domain:
  - `DeclaredSquarespaceDomainRegistration` — unlocked, dnssec disabled
  - `DeclaredSquarespaceDomainNameservers` — target nameservers
  - `DeclaredSquarespaceDomainTransferRequest` — auth code requested

### config files

- `provision/usecase.transferout/nameservers.env=test.json` — cloudflare nameservers for test
- `provision/usecase.transferout/nameservers.env=prod.json` — placeholder for prod

### env vars

| var | default | description |
|-----|---------|-------------|
| ENV | prod | test or prod |
| RENEWS_UNTIL | 1 month from now | filter domains that expire by this date |

### deleted

- `step0.prepare.enumerate/` — merged into unified resources.ts
- `step1.prepare.nameservers/` — merged into unified resources.ts

## todo

### test the unified flow

```sh
rhx browser.start --mode HEADFUL --refresh
rhx keyrack unlock --owner ehmpath --env test
ENV=test npx declastruct plan --wish provision/usecase.transferout/resources.ts --into provision/usecase.transferout/plan.json
ENV=test npx declastruct apply --plan provision/usecase.transferout/plan.json
```

### known issue: deserialize doesn't restore .clone()

`getAllDomains` returns class instances, but the cache layer via `withRemoteStateQueryCache` serializes/deserializes them. The `deserialize` from domain-objects doesn't apply `withImmute`, so `.clone()` is unavailable.

**current workaround**: use `new DeclaredSquarespaceDomainRegistration({...domain, isLocked: false})` instead of `domain.clone({isLocked: false})`

**proper fix**: either:
1. wrap with `DomainObject.build()` or `withImmute()` after deserialize
2. or update `withRemoteStateQueryCache` deserialize to apply `withImmute`

## files changed

```
provision/usecase.transferout/
├── resources.ts              # unified wish file
├── getSquarespaceProvider.ts # shared provider with cache
├── nameservers.env=test.json # cloudflare nameservers
├── nameservers.env=prod.json # prod nameservers (placeholder)
└── readme.md                 # updated usage docs
```

## next steps

1. run plan + apply to verify unified flow works
2. (optional) fix deserialize to restore `.clone()` method
3. update playtest to match unified flow
