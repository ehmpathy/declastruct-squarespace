# self-review: has-clear-instructions

## question: can the foreman follow without prior context?

**yes.** the playtest includes:

1. **prerequisites section** explains credential provision two ways:
   - keyrack: copy-paste `chmod +x ...` and `./.agent/.../keyrack.fill.sh --env test`
   - env vars: direct export commands

2. **test account requirements** explicit:
   - squarespace account with at least one domain
   - 2fa must be authenticator app (totp) — sms/passkey explicitly NOT supported

3. **each test step** standalone:
   - numbered steps
   - npm commands are exact
   - no implicit knowledge required

## question: are commands copy-pasteable?

**yes.** verified each command:

```sh
npm run test:integration -- scrapeDomainsList.integration.test.ts
npm run test:integration -- scrapeDnsRecords.integration.test.ts
npm run test:integration -- scrapeDomainDetail.integration.test.ts
npm run test:integration -- scrapeTransferRequests.integration.test.ts
npm run test:acceptance
npm run test:unit -- detectCaptchaChallenge.test.ts
```

all commands are exact paths with correct `--` separator.

## question: are expected outcomes explicit?

**yes.** each test has:

- **pass criteria**: specific observables (e.g., "output shows at least one domain with name, status, registrar")
- **fail criteria**: specific failure indicators (e.g., "test fails with authentication error", "empty domain list returned")

## conclusion

instructions are followable. no issues found.
