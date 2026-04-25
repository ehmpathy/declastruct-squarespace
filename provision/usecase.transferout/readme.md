# usecase.transferout

transfer domains out of squarespace to another registrar.

## setup

store credentials in keyrack (default owner, env prod):

```sh
npx rhx keyrack set --key SQUARESPACE_EMAIL --env prod --vault os.secure
npx rhx keyrack set --key SQUARESPACE_PASSWORD --env prod --vault os.daemon
npx rhx keyrack set --key SQUARESPACE_TOTP_SECRET --env prod --vault os.daemon
```

## config

### nameservers

edit `nameservers.env=test.json` or `nameservers.env=prod.json` to set target nameservers.

### exclusions

edit `exclusions.env=test.json` or `exclusions.env=prod.json` to exclude domains from transfer-out.

**why exclusions exist:** squarespace assigns different cloudflare nameservers to different accounts. when you add a new domain or create a new account, squarespace may assign a different pair of nameservers (e.g., `bryce.ns.cloudflare.com` + `itzel.ns.cloudflare.com` vs `randy.ns.cloudflare.com` + `val.ns.cloudflare.com`).

domains registered under an older account may have different nameservers already configured in cloudflare. if transfer-out runs on these domains, it would overwrite their nameservers with the current config, which would break dns resolution until cloudflare is updated.

to protect these domains, add them to the exclusions list and handle them separately (either with a different nameserver config or manual transfer).

## usage

single declastruct run prepares domains for transfer:
- unlocks domain
- disables dnssec
- sets nameservers to target
- requests auth code

```sh
# start browser (--refresh kills extant browser and starts fresh)
rhx browser.start --mode HEADFUL --refresh

# test env (defaults to ehmpath owner)
ENV=test npx declastruct plan --wish provision/usecase.transferout/resources.ts --into provision/usecase.transferout/plan.local.json
ENV=test npx declastruct apply --plan provision/usecase.transferout/plan.local.json

# prod env with date filter (domains that expire by may 1st)
ENV=prod OWNER=myowner RENEWS_UNTIL=2026-05-01 npx declastruct plan --wish provision/usecase.transferout/resources.ts --into provision/usecase.transferout/plan.local.json
ENV=prod OWNER=myowner npx declastruct apply --plan provision/usecase.transferout/plan.local.json
```

## env vars

| var | default | description |
|-----|---------|-------------|
| ENV | prod | test or prod |
| OWNER | ehmpath (test) / required (prod) | keyrack owner for credentials |
| RENEWS_UNTIL | 2 months from now | filter domains that expire by this date |
| FILTER_DOMAIN | (none) | filter to specific domain (e.g., rhoam.org) |
| SKIP_TRANSFER_REQUEST | false | set to `true` to skip auth code request |

## common issues

### "credentials not found"

verify keyrack has the credentials:
```sh
npx rhx keyrack get --key SQUARESPACE_EMAIL --env prod
```

### "totp code invalid"

re-extract totp secret from authenticator app setup.

### browser hangs

check if squarespace is blocked by cloudflare. use headful browser to see page state.

## handoff

after apply completes, extract domain list for the target registrar:

```sh
jq '[.changes[] | select(.forResource.class == "DeclaredSquarespaceDomainRegistration") | {name: .state.desired.name, expires: .state.desired.expirationDate}] | unique_by(.name)' provision/usecase.transferout/plan.local.json > provision/usecase.transferout/handoff.local.json
```

use `handoff.local.json` to initiate transfer-in on the target registrar (e.g., cloudflare).
