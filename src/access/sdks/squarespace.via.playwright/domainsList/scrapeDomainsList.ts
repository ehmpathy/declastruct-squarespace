import type { Page } from 'playwright';

import { waitForSquarespaceReactRender } from '../navigation/waitForSquarespaceReactRender';
import { domainsListSelectors } from '../selectors/domainsListSelectors';
import { scrollToLoadAllDomains } from './scrollToLoadAllDomains';

/**
 * .what = raw domain data scraped from the domains list page
 * .why = pre-cast shape before transform to domain object
 */
export interface RawDomainListItem {
  name: string;
  status: string;
  expiryText: string | null;
  hasRenewalIndicator: boolean;
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

    // wait for React to render content (not just shell - shell has noscript fallback)
    // .note = use forContent to wait for actual domain rows or empty state
    //         60s default timeout is needed for slow initial renders
    await waitForSquarespaceReactRender({
      page,
      forContent: `${domainsListSelectors.domainRow}, ${domainsListSelectors.emptyState}`,
    });

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

    // detect renewal indicator (refresh icon with renews-tooltip)
    const renewalIndicator = await row.$(domainsListSelectors.renewalIndicator);
    const hasRenewalIndicator = renewalIndicator !== null;

    domains.push({
      name: name.trim(),
      status: (status ?? 'unknown').trim(),
      expiryText: expiryText?.trim() ?? null,
      hasRenewalIndicator,
    });
  }

  return domains;
};
