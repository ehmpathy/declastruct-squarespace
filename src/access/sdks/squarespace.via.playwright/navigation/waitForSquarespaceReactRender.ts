import type { Page } from 'playwright';

/**
 * .what = waits for squarespace React app to render
 * .why = body exists immediately with noscript fallback; content only appears after React hydrates
 *
 * .usage
 *   // wait for shell only (not recommended)
 *   await waitForSquarespaceReactRender({ page });
 *
 *   // wait for shell + content (recommended)
 *   await waitForSquarespaceReactRender({ page, forContent: '[data-testid="dns-record-row"]' });
 */
export const waitForSquarespaceReactRender = async (input: {
  page: Page;
  /** selector for page-specific content — waits for this after shell renders */
  forContent?: string;
  /** timeout for shell render (default 30s) */
  shellTimeoutMs?: number;
  /** timeout for content render (default 60s) */
  contentTimeoutMs?: number;
}): Promise<void> => {
  const {
    page,
    forContent,
    shellTimeoutMs = 30000,
    contentTimeoutMs = 60000,
  } = input;

  // wait for React-rendered shell elements
  // .note - squarespace uses header[data-testid] and main, not <nav>
  await page.waitForSelector(
    'header[data-testid="standard-nav"], main, #renderTarget, [data-test]',
    { timeout: shellTimeoutMs },
  );

  // wait for page-specific content if selector provided
  if (forContent) {
    try {
      await page.waitForSelector(forContent, { timeout: contentTimeoutMs });
    } catch {
      const bodyText = await page.locator('body').textContent();
      throw new Error(
        `waitForSquarespaceReactRender: content did not render within ${contentTimeoutMs}ms. ` +
          `selector=${forContent}. body preview: ${bodyText?.slice(0, 500)}`,
      );
    }
  }
};
