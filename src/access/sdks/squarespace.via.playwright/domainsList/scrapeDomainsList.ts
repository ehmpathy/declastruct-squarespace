import type { Page } from 'playwright';

import { waitForSquarespaceReactRender } from '../navigation/waitForSquarespaceReactRender';
import { domainsListSelectors } from '../selectors/domainsListSelectors';

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
 * .how = navigates through all pages via button pagination, scrapes each page
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
  }

  // always wait for React to render content (not just shell - shell has noscript fallback)
  // .note = required even if already on /domains (cached page may not have content yet)
  // .note = 60s default timeout is needed for slow initial renders
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

  // check for empty state
  const emptyState = await page.$(domainsListSelectors.emptyState);
  if (emptyState) {
    return [];
  }

  // scrape all pages via button pagination
  const allDomains: RawDomainListItem[] = [];
  let hasMorePages = true;
  let pageNum = 1;

  while (hasMorePages) {
    // scrape current page
    const domainsOnPage = await scrapeCurrentPage({ page });
    allDomains.push(...domainsOnPage);
    console.log(
      `scrapeDomainsList: page ${pageNum} scraped, ${domainsOnPage.length} domains (total: ${allDomains.length})`,
    );

    // check for next page button
    const nextButton = await page.$(domainsListSelectors.nextPageButton);
    if (!nextButton) {
      hasMorePages = false;
      continue;
    }

    // check if next button is disabled (no more pages)
    const isDisabled = await nextButton.isDisabled();
    if (isDisabled) {
      hasMorePages = false;
      continue;
    }

    // click next page
    await nextButton.click();
    await page.waitForTimeout(500);
    pageNum++;

    // wait for load spinner to disappear
    const spinner = await page.$(domainsListSelectors.loadSpinner);
    if (spinner) {
      await page.waitForSelector(domainsListSelectors.loadSpinner, {
        state: 'hidden',
        timeout: 10000,
      });
    }

    // wait for new rows to appear
    await page.waitForSelector(domainsListSelectors.domainRow, {
      timeout: 10000,
    });
  }

  return allDomains;
};

/**
 * .what = scrapes domain rows from the current page
 * .why = extracts raw domain data from visible rows
 */
const scrapeCurrentPage = async (input: {
  page: Page;
}): Promise<RawDomainListItem[]> => {
  const { page } = input;

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
