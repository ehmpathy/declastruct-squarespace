import type { Page } from 'playwright';

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
  await page.goto('https://account.squarespace.com/domains/transfers');
  await page.waitForLoadState('networkidle');

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
