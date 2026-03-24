import type { Page } from 'playwright';

/**
 * .what = navigates to a URL, waits for content, then asserts URL
 * .why = squarespace SPA may redirect after navigation; wait for content then verify
 * .note = body content is the "logical load event" — check URL after content appears
 */
export const navigateAndAssertUrl = async (input: {
  page: Page;
  url: string;
  urlPattern: (url: URL) => boolean;
  contentSelector?: string;
  operationName: string;
  timeoutMs?: number;
}): Promise<void> => {
  const { page, url, urlPattern, operationName, timeoutMs = 10000 } = input;
  const contentSel = input.contentSelector ?? 'main, [role="main"], body';

  // navigate to target URL
  await page.goto(url);
  await page.waitForLoadState('load');

  // wait for body content to appear - this is the "logical load event"
  // .note = content appears AFTER React hydration and any redirects complete
  await page.waitForSelector(contentSel, { timeout: timeoutMs });

  // fail-fast: assert URL matches expected pattern AFTER content load
  // .note = check AFTER content load because SPA may redirect post-hydration
  const currentUrl = page.url();
  if (!urlPattern(new URL(currentUrl))) {
    throw new Error(
      `${operationName}: URL mismatch after content load. navigated to ${url}, but URL is now ${currentUrl}. squarespace may have redirected.`,
    );
  }
};
