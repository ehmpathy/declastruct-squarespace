# rule.require.bounded-timeouts-and-bisection

## .what

all async operations must have bounded timeouts. all delays must be diagnosed via systematic bisection with fail-fast logs.

## .why

- silent hangs waste hours of debug time
- unbound awaits mask root cause
- without fail-fast timeouts, you cannot isolate the slow operation
- without diagnostic logs, you cannot see where execution stopped

## .bounded timeout requirements

every async operation must have a timeout:

| context | max timeout | fail-fast behavior |
|---------|-------------|-------------------|
| spawnSync subprocess | 30s | kill process, log stdout/stderr |
| playwright waitForSelector | 30s | throw with page URL |
| playwright waitForTimeout | FORBIDDEN | use waitForSelector instead |
| fetch/http requests | 30s | throw with request details |
| database queries | 30s | throw with query info |

## .forbidden patterns

```ts
// forbidden: unbound await
await page.waitForSelector(selector);  // no timeout = can hang forever

// forbidden: arbitrary fixed delay
await page.waitForTimeout(5000);  // masks real time, no fail-fast

// forbidden: subprocess without timeout
spawnSync(cmd, args);  // can hang forever
```

## .required patterns

```ts
// required: bounded timeout with fail-fast
await page.waitForSelector(selector, { timeout: 30000 });

// required: subprocess with timeout and diagnostic output
const result = spawnSync(cmd, args, { timeout: 30000 });
if (result.signal === 'SIGTERM') {
  console.error(`[TIMEOUT] killed after 30s`);
  console.error('stdout:', result.stdout?.slice(-2000));
  throw new Error('command timed out');
}

// required: wait for specific element, not arbitrary delay
await page.waitForSelector('[data-test="success"]', { timeout: 30000 });
```

## .bisection diagnosis workflow

when a test exceeds expected time:

1. **add time logs at each major step**
   ```ts
   console.log('[TIME] step1 start');
   await step1();
   console.log('[TIME] step1 done');
   ```

2. **add bounded timeout to each step**
   ```ts
   await step1({ timeout: 10000 });  // fail-fast at 10s
   ```

3. **run test and observe where it stops**
   - last log printed = step that hung
   - timeout error = which operation exceeded

4. **bisect the slow step**
   - add finer-grained logs within the slow step
   - reduce timeout to force faster failure
   - repeat until root cause isolated

5. **fix root cause, not symptom**
   - do not increase timeout
   - do not add arbitrary delays
   - fix the actual slow operation

## .diagnostic output requirements

when a timeout fires, output must include:

| info | why |
|------|-----|
| operation name | which step failed |
| elapsed time | how long before timeout |
| partial output | stdout/stderr captured so far |
| page URL (browser) | where playwright was when it hung |
| last successful step | narrow down location |

## .enforcement

- unbound await = blocker
- waitForTimeout usage = blocker
- subprocess without timeout = blocker
- timeout > 30s without justification = blocker
- timeout without diagnostic output = blocker

## .see also

- rule.require.fast-tests (90s max for all tests)
- rule.require.fail-fast (early exits on invalid state)
