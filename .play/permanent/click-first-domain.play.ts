import type { Page, Browser } from 'playwright';

/**
 * .what = click the first domain in the domains list
 * .why = navigate to domain detail page
 */
export const action = async (input: { page: Page; browser: Browser }) => {
  const { page } = input;

  // wait for domains table
  await page.waitForSelector('table tbody tr', { timeout: 10000 });

  // click first domain link
  const firstDomainLink = page.locator('table tbody tr a').first();
  const domainName = await firstDomainLink.textContent();

  await firstDomainLink.click();

  // wait for navigation
  await page.waitForLoadState('load');

  return {
    domain: domainName?.trim(),
    url: page.url(),
  };
};
