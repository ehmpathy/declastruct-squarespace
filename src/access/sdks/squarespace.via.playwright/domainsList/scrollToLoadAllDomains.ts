import type { Page } from 'playwright';

import { domainsListSelectors } from '../selectors/domainsListSelectors';

/**
 * .what = scrolls through the domains list to load all domains via infinite scroll
 * .why = squarespace uses infinite scroll/pagination, so we must scroll to load all 300+ domains
 */
export const scrollToLoadAllDomains = async (input: {
  page: Page;
}): Promise<void> => {
  const { page } = input;

  // wait for initial domains to load
  await page.waitForSelector(domainsListSelectors.domainRow, {
    timeout: 30000,
  });

  // .note = deliberate mutation: infinite scroll requires state tracked across iterations
  // track previous count to detect when all domains are loaded
  let previousCount = 0;
  let currentCount = 0;
  let noNewDomainsAttempts = 0;
  const maxNoNewDomainsAttempts = 3;

  // scroll until no new domains load
  while (noNewDomainsAttempts < maxNoNewDomainsAttempts) {
    // count current domains
    currentCount = await page.locator(domainsListSelectors.domainRow).count();

    // check if new domains were loaded
    const hasNewDomains = currentCount > previousCount;
    if (hasNewDomains) {
      previousCount = currentCount;
      noNewDomainsAttempts = 0;
    }
    if (!hasNewDomains) {
      noNewDomainsAttempts++;
    }

    // scroll to bottom to trigger more loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // wait for potential new content to load
    await page.waitForTimeout(1000);

    // check for load spinner and wait for it to disappear
    const spinner = await page.$(domainsListSelectors.loadSpinner);
    if (spinner) {
      await page.waitForSelector(domainsListSelectors.loadSpinner, {
        state: 'hidden',
        timeout: 10000,
      });
    }
  }
};
