# howto.diagnose.process-hang-after-tests

## .what

when Node.js hangs after tests complete, diagnose via type inspection at the cleanup site — not via external diagnostic tools.

## .the slow path (what I did)

1. observed process hang
2. created `prove-handles.ts` diagnostic file
3. added `process._getActiveHandles()` introspection
4. ran diagnostic, saw TCPWRAP handles
5. traced back to browser session
6. eventually found the `await` was absent

total time: ~30 minutes

## .the fast path (what I should have done)

1. observed process hang after test
2. found cleanup hook (`afterAll`) that closes resources
3. checked: does `cache.get()` return a Promise or resolved value?
4. read the cache package docs (1 minute)
5. found: `withSimpleCache` stores Promises, not resolved values
6. added `await` before method call

total time: ~5 minutes

## .the lesson

**read the package docs before you write diagnostic code.**

when cleanup code calls methods on cached values:
1. check the cache package API — does `get()` return `T` or `Promise<T>`?
2. if async factory was cached, the cache stores the Promise
3. add `await` before method calls

## .diagnostic shortcut

```ts
// suspect code
const session = cache.get(key);
if (session) session.close();  // hangs?

// fast check: what does cache.get() return?
// read: npm docs for the cache package
// or: hover in IDE to see return type
// answer: Promise<T> | undefined

// fix: await it
const session = await cache.get(key);
if (session) session.close();
```

## .when to use external diagnostics

only after you've checked:
- [ ] cleanup hooks exist and run
- [ ] cached values are properly awaited
- [ ] package docs confirm expected behavior

if those check out and it still hangs, then use `--detectOpenHandles` or `process._getActiveHandles()`.
