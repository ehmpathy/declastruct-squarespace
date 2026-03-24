# howto provision test credentials for ehmpaths

## .what

use keyrack to provision test credentials that ehmpath clones can supply to integration tests from their terminals.

## .why

- enables ehmpath clones (agents) to run integration tests autonomously
- no hardcoded credentials in code or env files
- credentials encrypted at rest, decrypted on demand
- shared across ehmpathy repos via ehmpath owner keyrack
- fail-fast when credentials absent (clear guidance)

## .how

### prereq: ehmpath keyrack

the ehmpath keyrack is shared across all ehmpathy repos. initialize it once per machine:

```sh
npx rhachet roles init --repo ehmpathy --role mechanic --init keyrack.ehmpath
```

this creates:
- `~/.ssh/ehmpath` — passwordless ssh key for encryption
- `~/.rhachet/keyrack/keyrack.host.ehmpath.age` — encrypted host manifest

### configure repo-specific keys

each repo declares its required keys in `.agent/keyrack.yml` and provides a fill skill:

```sh
chmod +x ./.agent/repo=.this/role=any/skills/keyrack.fill.sh
./.agent/repo=.this/role=any/skills/keyrack.fill.sh --env test
```

the fill skill:
1. verifies ehmpath keyrack exists
2. prompts for each required key (if not already configured)
3. for test env: stores in both your keyrack and ehmpath keyrack
4. for prod env: stores in your keyrack only (agents do not have prod access)
5. verifies keys can be fetched back

### integration test setup

integration tests fetch credentials via keyrack with `--json` for robust parse:

```typescript
// jest.integration.env.ts
const result = JSON.parse(
  execSync(
    'npx rhx keyrack get --owner ehmpath --key SQUARESPACE_EMAIL --env test --json',
    { encoding: 'utf-8' },
  ),
);
process.env.SQUARESPACE_EMAIL = result.value;
```

or use the daemon for faster repeated access:

```typescript
// unlock once at test start
execSync('npx rhx keyrack unlock --owner ehmpath --env test --prikey ~/.ssh/ehmpath');

// get is instant after unlock (still use --json)
const result = JSON.parse(
  execSync(
    'npx rhx keyrack get --owner ehmpath --key SQUARESPACE_PASSWORD --env test --json',
    { encoding: 'utf-8' },
  ),
);
process.env.SQUARESPACE_PASSWORD = result.value;
```

## .pattern

### .agent/keyrack.yml

declare required credentials per environment:

```yaml
org: ehmpathy

extends:
  - .agent/repo=ehmpathy/role=mechanic/keyrack.yml  # inherit mechanic keys

env.prod:
  # - AWS_PROFILE

env.test:
  - SQUARESPACE_EMAIL
  - SQUARESPACE_PASSWORD
  - SQUARESPACE_TOTP_SECRET
```

the keyrack system reads this manifest and:
1. knows which keys are required for each env
2. can fetch all keys for a given env via `--for repo`
3. fails fast if required keys are absent

## .refresh

when tokens expire:

```sh
# refresh specific key
./.agent/repo=.this/role=any/skills/keyrack.fill.sh --env test --refresh SQUARESPACE_PASSWORD

# refresh all keys
./.agent/repo=.this/role=any/skills/keyrack.fill.sh --env test --refresh @all
```

## .envs

| env | use case |
|-----|----------|
| `test` | integration tests, local development |
| `prep` | pre-production environments |
| `prod` | production (requires separate approval) |
| `all` | available in all environments |

for test credentials, always use `--env test` to prevent accidental prod usage.

## .security

keyrack provides multiple isolation layers to prevent credential leaks:

| layer | isolation | example |
|-------|-----------|---------|
| **repo** | `.agent/keyrack.yml` allowlist | `--for repo` only returns keys declared in manifest |
| **owner** | separate keyracks per owner | `--owner ehmpath` vs `--owner ahbode` |
| **org** | same owner, different orgs | scoped separately per org |
| **env** | test vs prep vs prod | `--env test` cannot access `--env prod` keys |

**key guarantees**:
- `--for repo` only returns keys declared in `.agent/keyrack.yml`
- `--key SOME_KEY` blocked if key not in manifest
- keys from other repos, other owners, or other orgs are not accessible

## .see also

- `.agent/repo=.this/role=any/skills/keyrack.fill.sh` — fill keyrack for this repo
- `npx rhx keyrack --help` — full keyrack documentation
- `.agent/repo=ehmpathy/role=mechanic/inits/keyrack.ehmpath.sh` — ehmpath keyrack setup
