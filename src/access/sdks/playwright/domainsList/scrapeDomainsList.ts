import type { Page } from 'playwright';

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
  if (!currentUrl.includes('/config/domains')) {
    await page.goto('https://account.squarespace.com/domains');
    await page.waitForLoadState('networkidle');
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
