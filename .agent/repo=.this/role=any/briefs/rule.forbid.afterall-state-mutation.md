# rule.forbid.afterall-state-mutation

## .what

no afterAll hooks that mutate state. no cleanup. no restore. no re-lock. no re-enable.

## .why

afterAll runs even when tests fail:
1. test fails mid-operation
2. page is in broken state (modal open, half-filled form)
3. afterAll tries to "restore" state
4. afterAll scrolls, clicks, fails silently
5. developer sees unexpected behavior after test failure
6. `.catch(() => {})` hides real errors

if state needs reset, let the NEXT test handle it at the start.

## .pattern

```ts
// bad: cleanup in afterAll
afterAll(async () => {
  await toggleDomainLock({ targetState: 'locked' }).catch(() => {});
});

// bad: close page in afterAll
afterAll(async () => {
  await page.close();
});

// good: no afterAll at all
// let browser persist, let next test clear prior state
```

## .what to do instead

1. **prior state at test start**: each operation should clear leftover modals/state before proceed
2. **browser persists**: reuse browser across tests, no close
3. **idempotent operations**: operations handle "already in target state" gracefully

## .enforcement

afterAll with state mutation = blocker
