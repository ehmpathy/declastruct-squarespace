# usecase.transferout

transfer domains out of squarespace to another registrar.

## setup

store credentials in keyrack (default owner, env prod):

```sh
npx rhx keyrack set --key SQUARESPACE_EMAIL --env prod
npx rhx keyrack set --key SQUARESPACE_PASSWORD --env prod --vault os.daemon
npx rhx keyrack set --key SQUARESPACE_TOTP_SECRET --env prod --vault os.daemon
```

## config

edit `nameservers.env=test.json` or `nameservers.env=prod.json` to set target nameservers.

## usage

single declastruct run prepares domains for transfer:
- unlocks domain
- disables dnssec
- sets nameservers to target
- requests auth code

```sh
# start browser (--refresh kills extant browser and starts fresh)
rhx browser.start --mode HEADFUL --refresh

# test env (uses ehmpath owner keyrack)
ENV=test npx declastruct plan --wish provision/usecase.transferout/resources.ts --into provision/usecase.transferout/plan.json
ENV=test npx declastruct apply --plan provision/usecase.transferout/plan.json

# prod env with date filter (domains that expire by may 1st)
ENV=prod RENEWS_UNTIL=2026-05-01 npx declastruct plan --wish provision/usecase.transferout/resources.ts --into provision/usecase.transferout/plan.json
ENV=prod npx declastruct apply --plan provision/usecase.transferout/plan.json
```

## env vars

| var | default | description |
|-----|---------|-------------|
| ENV | prod | test or prod |
| RENEWS_UNTIL | 1 month from now | filter domains that expire by this date |

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
