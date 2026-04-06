# self-review: has-critical-paths-frictionless (r8)

## review criteria

from the guide:
> double-check: are the critical paths frictionless in practice?
>
> for each critical path:
> - run through it manually — is it smooth?
> - are there unexpected errors?
> - does it feel effortless to the user?

---

## step 0: run the tests to verify in practice

**command:** `npm run test:integration -- setNameservers.play.integration.test.ts`

**result:**

```
Tests:       11 passed, 11 total
Time:        130.418 s
```

all 11 tests passed. the test run exercised all three critical paths end-to-end against the live squarespace UI. no manual intervention was required.

---

## step 1: identify critical paths

from repros (`.behavior/v2026_04_04.feat-nameservers/3.2.distill.repros.experience._.v1.i1.md`):

| critical path | description |
|---------------|-------------|
| swap to cloudflare | set custom nameservers on domain with squarespace defaults |
| swap back to squarespace | reset nameservers to null on domain with custom NS |
| idempotent upsert | repeat upsert with same value produces same result |

---

## step 2: verify each path is frictionless

### path 1: swap to cloudflare

**test location:** `setNameservers.play.integration.test.ts` case1 [t1]

**friction check:**

| criterion | status | evidence |
|-----------|--------|----------|
| executes without manual intervention | yes | `npm run test:integration -- setNameservers.play` completes |
| verifies outcome via assertions | yes | `expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS)` |
| no sleeps or arbitrary waits | yes | uses `waitForSelector` with bounded timeouts |

**code sample (lines 55-71):**

```typescript
when('[t1] setNameservers upsert to cloudflare', () => {
  const result = useThen('it succeeds', async () =>
    setNameservers(
      { upsert: { domain: refByUnique(scene.domain), nameservers: CLOUDFLARE_NS } },
      context.agentOptions,
    ),
  );

  then('returns entity with custom nameservers', () => {
    expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS);
  });
});
```

**frictionless:** yes

---

### path 2: swap back to squarespace

**test location:** `setNameservers.play.integration.test.ts` case1 [t3]

**friction check:**

| criterion | status | evidence |
|-----------|--------|----------|
| executes without manual intervention | yes | part of same test run |
| verifies outcome via assertions | yes | `expect(result.ns.nameservers).toBeNull()` |
| no sleeps or arbitrary waits | yes | uses `waitForSelector` with bounded timeouts |

**code sample (lines 88-104):**

```typescript
when('[t3] setNameservers upsert back to null', () => {
  const result = useThen('it succeeds', async () =>
    setNameservers(
      { upsert: { domain: refByUnique(scene.domain), nameservers: null } },
      context.agentOptions,
    ),
  );

  then('returns entity with null nameservers', () => {
    expect(result.ns.nameservers).toBeNull();
  });
});
```

**frictionless:** yes

---

### path 3: idempotent upsert

**test location:** `setNameservers.play.integration.test.ts` case2

**friction check:**

| criterion | status | evidence |
|-----------|--------|----------|
| executes without manual intervention | yes | part of same test run |
| verifies outcome via assertions | yes | `expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS)` |
| verifies idempotency | yes | repeat call produces same result |

**code sample (lines 122-159):**

```typescript
given('[case2] idempotent upsert', () => {
  // ... setup with CLOUDFLARE_NS ...

  when('[t0] upsert with same value', () => {
    const result = useThen('it succeeds', async () =>
      setNameservers(
        { upsert: { domain: refByUnique(scene.domain), nameservers: CLOUDFLARE_NS } },
        context.agentOptions,
      ),
    );

    then('returns entity with same nameservers', () => {
      expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS);
    });

    then('operation is fast (no UI change needed)', () => {
      expect(result.duration).toBeLessThan(30000);
    });
  });
});
```

**frictionless:** yes

---

## step 3: verify error cases have actionable messages

**test location:** `validateNameserversInput.test.ts`

| error case | message | actionable? |
|------------|---------|-------------|
| < 2 nameservers | "minimum 2 nameservers required" | yes — tells user minimum count |
| invalid FQDN | "invalid nameserver format: {ns}" | yes — identifies bad nameserver |
| > 13 nameservers | "maximum 13 nameservers allowed" | yes — tells user maximum count |

**code sample (lines 37-43):**

```typescript
then('throws BadRequestError with "minimum 2 nameservers" message', () => {
  expect(() => validateNameserversInput({ nameservers: ['ns1.cloudflare.com'] }))
    .toThrow(BadRequestError);
  expect((error as Error).message).toContain('minimum 2 nameservers');
});
```

**actionable:** yes — each error tells user exactly what constraint was violated and how to fix it.

---

## step 4: verify no friction anti-patterns

| anti-pattern | present? | evidence |
|--------------|----------|----------|
| manual intervention required | no | all tests run via `npm run test:integration` |
| arbitrary `waitForTimeout` | no | uses `waitForSelector` with bounded timeouts |
| flaky selectors | no | uses `data-testid` where available |
| unbounded loops | no | all waits have explicit timeouts |
| silent failures | no | all operations throw on error |

---

## conclusion

**holds**: all critical paths are frictionless.

1. **swap to cloudflare**: executes without intervention, verifies via assertions
2. **swap back to squarespace**: executes without intervention, verifies via assertions
3. **idempotent upsert**: executes without intervention, verifies via assertions

error cases provide actionable messages that tell users exactly what went wrong and how to fix it.

no friction anti-patterns detected. all tests use bounded waits and explicit assertions.
