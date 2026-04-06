# self-review: has-zero-test-skips

## search results

### .skip() and .only()
searched all nameservers test files for `.skip(` and `.only(`:
- `src/domain.operations/domainNameservers/*.test.ts` — no matches
- `src/access/daos/*Nameservers*.test.ts` — no matches
- `src/access/sdks/squarespace.via.playwright/domainNameservers/*.test.ts` — no matches

**holds**: no skips or onlys found.

### silent credential bypasses
searched for patterns like `if (!credential) return` that would silently skip tests:
- no matches found

all integration tests use `requireSquarespaceCredentials()` which is a fail-fast guard:
```typescript
export const requireSquarespaceCredentials = (): void => {
  if (!process.env.SQUARESPACE_EMAIL || !process.env.SQUARESPACE_PASSWORD)
    UnexpectedCodePathError.throw('squarespace credentials required', {
      hint: 'set SQUARESPACE_EMAIL and SQUARESPACE_PASSWORD environment variables',
    });
};
```

this throws if credentials are absent — tests cannot silently pass without credentials.

**holds**: no silent credential bypasses.

### prior failures carried forward
the integration test run showed:
- 25 nameservers tests: all passed
- 8 tests failed in unrelated suites (`setTransferRequest`, `scrapeDnsRecords`)

the nameservers feature carries no prior failures forward — all its tests run and pass.

**holds**: no prior failures in nameservers tests.

## conclusion

- no `.skip()` or `.only()` in nameservers test files
- no silent credential bypasses (fail-fast via `requireSquarespaceCredentials`)
- no prior failures carried forward

**holds**: zero test skips.
