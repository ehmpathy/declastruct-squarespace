# rule.require.wait-for-target-element

## .what

before interact with an element, always wait for that exact element to be visible. do not wait only for a container or page shell.

## .why

common defect pattern:
1. page.goto() completes
2. waitForSelector(container) passes
3. click(button) fires
4. button was not yet rendered → click has no effect
5. test fails, state unchanged

the page shell loads before dynamic content renders. React/SPA apps hydrate in stages.

## .pattern

```ts
// bad: wait for container, click immediately
await page.goto(url);
await page.waitForSelector('[data-test="container"]');
await page.click('[data-testid="my-button"]');  // may not be rendered yet

// good: wait for exact target before interact
await page.goto(url);
await page.waitForSelector('[data-test="container"]');
await page.waitForSelector('[data-testid="my-button"]', { timeout: 30000 });
await page.click('[data-testid="my-button"]');  // element confirmed visible
```

## .detect

symptoms that indicate "acted too soon":
- click returns without error but state unchanged
- element found but interaction has no effect
- test passes intermittently (race condition)
- add arbitrary `waitForTimeout` fixes the issue

## .fix

always waitForSelector on the exact element before:
- click()
- fill()
- check()
- isChecked()
- any interaction method

## .see also

- rule.require.wait-for-content-not-shell
- rule.require.spa-navigation-fail-fast

## .enforcement

interact without wait for target element = blocker

