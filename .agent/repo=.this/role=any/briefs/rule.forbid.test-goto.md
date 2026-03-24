# rule.forbid.test-goto

## .what

integration tests must never call `page.goto()` directly. navigation is the scraper's responsibility.

## .why

when tests call `goto`:
1. test navigates to page A
2. scraper navigates to page A again (redundant)
3. any open state (modals, auth) is lost
4. race conditions and refresh loops occur

## .pattern

```ts
// bad: test navigates
const scene = useBeforeAll(async () => {
  const page = await getNewLoggedInBrowserPage(context.agentOptions);
  await page.goto('https://account.squarespace.com/domains');  // test navigates
  return { page };
});

// good: let scraper navigate
const scene = useBeforeAll(async () => {
  const page = await getNewLoggedInBrowserPage(context.agentOptions);
  // page starts at about:blank or at last URL
  // scraper will navigate when called
  return { page };
});
```

## .scraper responsibility

scrapers check current URL and navigate only if needed:

```ts
if (!page.url().includes(`/domains/managed/${domain}`)) {
  await page.goto(targetUrl);
  await page.waitForLoadState('load');
}
await waitForSquarespaceReactRender({ page, forContent: targetSelector });
```

## .enforcement

`page.goto` in test files = blocker
