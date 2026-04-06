# usecase.transferout

demos for transfer-out workflow from squarespace to another registrar.

## setup

store your squarespace credentials in keyrack (default owner, env prod):

```sh
# email can be on disk
npx rhx keyrack set --key SQUARESPACE_EMAIL --env prod

# password and totp should use secure vault (not persisted to disk)
# recommended: --vault os.daemon or --vault os.1password
npx rhx keyrack set --key SQUARESPACE_PASSWORD --env prod --vault os.daemon
npx rhx keyrack set --key SQUARESPACE_TOTP_SECRET --env prod --vault os.daemon
```

## usecases

### get all domains

list all domains in your squarespace account with their status:

```sh
npx tsx provision/usecase.transferout/getAllDomains.ts
```

output shows each domain with:
- name
- status (active, expired, etc.)
- lock state and reason
- dnssec status
- registrar
- expiration date

### transfer domains (planned)

bulk transfer domains out of squarespace. this usecase will:
1. unlock each domain
2. disable dnssec
3. request transfer code
4. output transfer codes for use with new registrar

## faster iteration

for repeated runs, start a persistent browser to skip login each time:

```sh
# terminal 1: start browser
rhx browser.start --mode HEADFUL

# terminal 2: run (auto-discovers browser)
npx tsx provision/usecase.transferout/getAllDomains.ts
```

auto-discovers browser via `.cache/browser.default/ws-endpoint`.

## common issues

### "invalid credentials"

verify your email and password are correct. if you have 2fa enabled, you must provide `SQUARESPACE_TOTP_SECRET`.

### "totp code invalid"

your totp secret may be incorrect. re-extract it from your authenticator app setup.

### browser hangs

if the browser appears stuck, check if squarespace is blocked by cloudflare. try a headful browser to see the page state.
