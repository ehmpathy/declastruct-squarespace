# rule.require.wait-for-react-render

## .what

after every navigation, wait for React to fully hydrate via `waitForSquarespaceReactRender` with a `forContent` selector.

## .why

squarespace is a React SPA. the DOM appears before React attaches event handlers. if you interact too early:
1. click fires
2. React handler not attached yet
3. squarespace JS sees invalid state
4. page refreshes or breaks

## .pattern

```ts
// bad: wait for element existence only
await page.goto(url);
await page.waitForSelector('[data-testid="my-button"]');
await page.click('[data-testid="my-button"]');  // may fail

// good: wait for React hydration with target content
await page.goto(url);
await waitForSquarespaceReactRender({
  page,
  forContent: '[data-testid="my-button"]',
});
await page.click('[data-testid="my-button"]');  // safe
```

## .enforcement

scraper without `waitForSquarespaceReactRender({ forContent })` after navigation = blocker
