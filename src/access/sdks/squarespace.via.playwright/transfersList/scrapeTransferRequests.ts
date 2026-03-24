import type { Page } from 'playwright';

import { waitForSquarespaceReactRender } from '../navigation/waitForSquarespaceReactRender';
import { transfersListSelectors } from '../selectors/transfersListSelectors';

/**
 * .what = raw transfer request data scraped from transfers page
 * .why = pre-cast shape before transforming to domain object
 */
export interface RawTransferRequest {
  domainName: string;
  status: string;
  direction: string | null;
  initiatedDate: string | null;
  expiresAt: string | null;
}

/**
 * .what = scrapes all transfer requests from the account's transfers page
 * .why = extracts raw transfer data for monitoring transfer status
 */
export const scrapeTransferRequests = async (input: {
  page: Page;
}): Promise<RawTransferRequest[]> => {
  const { page } = input;

  // navigate to transfers page
  const expectedUrl = 'https://account.squarespace.com/domains/transfers';
  await page.goto(expectedUrl);
  await page.waitForLoadState('load');

  // wait for React to render (not just body - body has noscript fallback immediately)
  await waitForSquarespaceReactRender({ page });

  // check URL AFTER content load
  // .note - squarespace redirects /domains/transfers to /domains when no transfers exist
  const currentUrl = page.url();
  console.log('scrapeTransferRequests: final URL =', currentUrl);
  if (!currentUrl.includes('/domains/transfers')) {
    // redirect to /domains means no transfers exist
    if (currentUrl.includes('/domains')) {
      return [];
    }
    throw new Error(
      `scrapeTransferRequests: URL mismatch. expected /domains/transfers, got ${currentUrl}. squarespace may have redirected.`,
    );
  }

  // check for empty state
  const emptyStateVisible = await page
    .$(transfersListSelectors.emptyState)
    .then((el) => el !== null);

  if (emptyStateVisible) {
    return [];
  }

  // wait for container
  const containerVisible = await page
    .$(transfersListSelectors.container)
    .then((el) => el !== null);

  if (!containerVisible) {
    return [];
  }

  // scrape all transfer rows
  const transferRows = await page.$$(transfersListSelectors.transferRow);
  const transfers: RawTransferRequest[] = [];

  for (const row of transferRows) {
    // extract transfer fields
    const domainElement = await row.$(transfersListSelectors.domainName);
    const statusElement = await row.$(transfersListSelectors.transferStatus);
    const directionElement = await row.$(
      transfersListSelectors.transferDirection,
    );
    const initiatedElement = await row.$(transfersListSelectors.initiatedDate);
    const expiresElement = await row.$(transfersListSelectors.expiresAt);

    const domainName = domainElement ? await domainElement.textContent() : '';
    const status = statusElement ? await statusElement.textContent() : '';
    const direction = directionElement
      ? await directionElement.textContent()
      : null;
    const initiatedDate = initiatedElement
      ? await initiatedElement.textContent()
      : null;
    const expiresAt = expiresElement
      ? await expiresElement.textContent()
      : null;

    transfers.push({
      domainName: (domainName ?? '').trim(),
      status: (status ?? '').trim(),
      direction: direction?.trim() ?? null,
      initiatedDate: initiatedDate?.trim() ?? null,
      expiresAt: expiresAt?.trim() ?? null,
    });
  }

  return transfers;
};
