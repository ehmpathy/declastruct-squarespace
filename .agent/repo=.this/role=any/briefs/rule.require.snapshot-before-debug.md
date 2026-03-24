# rule.require.snapshot-before-debug

## .what

before you assume any playwright test error is correct, always snapshot and review the screenshot and html to sanity check the error.

## .why

most test failures are our fault, not real errors:
- selectors are wrong or outdated
- awaits are insufficient — page hasn't fully rendered
- time issues — waited for shell, not content

the browser almost always works correctly. screenshots never show a broken page. the issue is usually that we don't wait long enough or select the right elements.

## .how

when a test fails:

1. **snapshot first** — don't trust the error message
   ```sh
   rhx browser.describe
   rhx browser.snapshot --tab N --url '/expected/path'
   ```

2. **review the screenshot** — does the page look correct?
   - if yes → our selectors/awaits are wrong
   - if no → investigate actual page issue

3. **review the html** — search for expected elements
   - if elements exist → our selector is wrong
   - if elements absent → we don't wait long enough

4. **fix the root cause**
   - usually: increase timeout, wait for specific content selector
   - rarely: actual page/api error

## .pattern

```ts
// bad — wait for page shell, scrape immediately
await page.waitForSelector('body');
const data = await scrapeData(page);  // fails: content not rendered

// good — wait for actual content
await page.waitForSelector('[data-testid="content-row"]', { timeout: 60000 });
const data = await scrapeData(page);  // succeeds: content is there
```

## .common mistakes

| symptom | likely cause |
|---------|--------------|
| "element not found" | selector wrong or content not rendered yet |
| "timeout for selector" | timeout too short, or selector never appears |
| empty array returned | waited for shell, scraped before content loaded |
| "please enable javascript" | scraped too early, react hasn't hydrated |

## .enforcement

debug without snapshot review first = blocker
