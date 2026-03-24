import type { Page } from 'playwright';

import { waitForSquarespaceReactRender } from '../navigation/waitForSquarespaceReactRender';
import { domainsListSelectors } from '../selectors/domainsListSelectors';
import { scrollToLoadAllDomains } from './scrollToLoadAllDomains';

/**
 * .what = raw domain data scraped from the domains list page
 * .why = pre-cast shape before transforming to domain object
 */
export interface RawDomainListItem {
  name: string;
  status: string;
  expiryText: string | null;
}

/**
 * .what = scrapes all domains from the squarespace domains list page
 * .why = extracts raw domain data for transformation into domain objects
 */
export const scrapeDomainsList = async (input: {
  page: Page;
}): Promise<RawDomainListItem[]> => {
  const { page } = input;

  // navigate to domains list if not already there
  const currentUrl = page.url();
  if (
    !currentUrl.includes('/domains') ||
    currentUrl.includes('/domains/managed/')
  ) {
    await page.goto('https://account.squarespace.com/domains');
    await page.waitForLoadState('load');

    // wait for React to render (not just body - body has noscript fallback immediately)
    await waitForSquarespaceReactRender({ page });

    // fail-fast: assert URL AFTER content load
    // .note - check after content because SPA may redirect post-hydration
    const settledUrl = page.url();
    console.log('scrapeDomainsList: final URL =', settledUrl);
    if (
      !settledUrl.includes('/domains') ||
      settledUrl.includes('/domains/managed/')
    ) {
      throw new Error(
        `scrapeDomainsList: URL mismatch. expected /domains (not /domains/managed/), got ${settledUrl}. squarespace may have redirected.`,
      );
    }
  }

  // wait for page content (domain table or empty state)
  // .note = fail-fast if neither selector appears in time
  const contentAppeared = await Promise.race([
    page
      .waitForSelector(domainsListSelectors.domainRow, { timeout: 15000 })
      .then(() => true),
    page
      .waitForSelector(domainsListSelectors.emptyState, { timeout: 15000 })
      .then(() => true),
  ]).catch(() => false);

  if (!contentAppeared) {
    const bodyText = await page.locator('body').textContent();
    throw new Error(
      `scrapeDomainsList: no domain content found. ` +
        `url=${page.url()}, bodyPreview=${bodyText?.slice(0, 500)}`,
    );
  }

  // check for empty state
  const emptyState = await page.$(domainsListSelectors.emptyState);
  if (emptyState) {
    return [];
  }

  // scroll to load all domains
  await scrollToLoadAllDomains({ page });

  // scrape all domain rows
  const domainRows = await page.$$(domainsListSelectors.domainRow);

  const domains: RawDomainListItem[] = [];
  for (const row of domainRows) {
    // extract domain name
    const nameElement = await row.$(domainsListSelectors.domainName);
    const name = nameElement ? await nameElement.textContent() : null;
    if (!name) continue;

    // extract status
    const statusElement = await row.$(domainsListSelectors.domainStatus);
    const status = statusElement
      ? await statusElement.textContent()
      : 'unknown';

    // extract expiry date
    const expiryElement = await row.$(domainsListSelectors.domainExpiry);
    const expiryText = expiryElement ? await expiryElement.textContent() : null;

    domains.push({
      name: name.trim(),
      status: (status ?? 'unknown').trim(),
      expiryText: expiryText?.trim() ?? null,
    });
  }

  return domains;
};
