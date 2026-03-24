import type { Page, Browser } from 'playwright';

/**
 * .what = navigate to squarespace domains list
 * .why = start point for domain exploration
 */
export const action = async (input: { page: Page; browser: Browser }) => {
  const { page } = input;

  await page.goto('https://account.squarespace.com/domains', {
    waitUntil: 'load',
  });

  // wait for domains table to render
  await page.waitForSelector('table', { timeout: 10000 });

  return { url: page.url() };
};
