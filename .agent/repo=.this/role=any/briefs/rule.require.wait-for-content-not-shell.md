# rule.require.wait-for-content-not-shell

## .what

after navigation, wait for the **actual content selector** you need to scrape, not just the page shell.

## .why

squarespace is a React SPA. render happens in stages:
1. body appears immediately (with noscript fallback)
2. header/nav renders (React hydration starts)
3. **content renders** (API data fetched, components mount)

`waitForSquarespaceReactRender` only waits for stage 2. if you scrape immediately after, you get empty results or "please enable javascript" errors.

## .pattern

```ts
// bad — wait for shell only
await page.goto(url);
await waitForSquarespaceReactRender({ page });
const data = await scrapeData(page);  // fails: content not rendered

// good — use forContent param
await page.goto(url);
await waitForSquarespaceReactRender({
  page,
  forContent: '[data-testid="content-row"]',
});
const data = await scrapeData(page);  // succeeds: content is there
```

the `forContent` param:
- waits for shell first (30s default)
- then waits for your content selector (60s default)
- throws helpful error with body preview if content never appears

## .timeout guidance

| content type | typical render time | recommended timeout |
|--------------|---------------------|---------------------|
| static page elements | 1-5s | 15s |
| list data (domains, records) | 5-15s | 60s |
| complex tables | 10-30s | 60s |

use longer timeouts. a 60s wait that succeeds in 5s is free. a 15s timeout that fails costs debug time.

## .selector choice

wait for the **most specific selector** that proves content rendered:

| page | wait for | not |
|------|----------|-----|
| domains list | `[data-testid="domain-row"]` | `table` |
| dns records | `[data-testid="dns-record-row"]` | `main` |
| domain detail | `[data-testid="domain-status"]` | `h1` |

## .fail-fast on timeout

when wait times out, capture page state for diagnosis:

```ts
try {
  await page.waitForSelector('[data-testid="content-row"]', { timeout: 60000 });
} catch {
  const bodyText = await page.locator('body').textContent();
  throw new Error(`content did not render. body preview: ${bodyText?.slice(0, 500)}`);
}
```

## .enforcement

scraper without content-specific wait = blocker
