# rule.require.spa-navigation-fail-fast

## .what

every scraper that navigates to a URL must:
1. wait for body content to appear (logical load event)
2. assert the URL matches expected pattern AFTER content load

## .why

squarespace is a SPA (Single Page Application) that performs client-side redirects AFTER the initial navigation completes. if we scrape immediately after `page.goto()`, we may scrape the wrong page because React hasn't finished its redirect.

## .problem

```ts
// bad: scrapes immediately after navigation
await page.goto(`https://account.squarespace.com/domains/managed/${domain}/dns`);
await page.waitForLoadState('load');
// squarespace may redirect us back to domains list here
const records = await scrapeRecords(page);  // wrong page!
```

## .solution

1. wait for body content to appear (logical load event)
2. check URL AFTER content load (not before)

```ts
// good: waits for content, THEN checks URL
await page.goto(`https://account.squarespace.com/domains/managed/${domain}/dns`);
await page.waitForLoadState('load');

// wait for body content - this is the "logical load event"
// content appears AFTER React hydration and any redirects complete
await page.waitForSelector('main, [role="main"], body', {
  timeout: 30000,
});

// fail-fast: assert URL AFTER content load
const currentUrl = page.url();
if (!currentUrl.includes(`/domains/managed/${domain}/dns`)) {
  throw new Error(
    `scrapeDnsRecords: URL mismatch. expected /domains/managed/${domain}/dns, got ${currentUrl}.`,
  );
}

// now safe to scrape — URL is verified
const records = await scrapeRecords(page);
```

## .reusable operation

use `navigateAndAssertUrl` from `src/access/sdks/squarespace.via.playwright/navigation/navigateAndAssertUrl.ts`:

```ts
import { navigateAndAssertUrl } from '../navigation/navigateAndAssertUrl';

await navigateAndAssertUrl({
  page,
  url: `https://account.squarespace.com/domains/managed/${domain}/dns`,
  urlPattern: (url) => url.href.includes(`/domains/managed/${domain}/dns`),
  operationName: 'scrapeDnsRecords',
});
```

## .why not timeout

arbitrary timeouts (e.g., `waitForTimeout(2000)`) are:
- non-deterministic: may be too short or too long
- wasteful: always waits full duration even when page is ready
- fragile: different network conditions need different timeouts

body content selector is deterministic: it waits for actual DOM state.

## .why check URL after content

- URL may match immediately after navigation but redirect happens post-hydration
- content load guarantees React has finished its work
- URL check after content load catches any redirects that happened

## .enforcement

scraper without fail-fast URL assertion = blocker
