import type { Page } from 'playwright';

import { waitForSquarespaceReactRender } from '../navigation/waitForSquarespaceReactRender';
import { domainDetailSelectors } from '../selectors/domainDetailSelectors';

/**
 * .what = raw domain detail data scraped from domain detail page
 * .why = pre-cast shape before transforming to domain object
 */
export interface RawDomainDetail {
  name: string;
  status: string;
  registrar: string | null;
  expirationDate: string | null;
  isLocked: boolean;
  lockReason: string | null;
  nameservers: string[];
}

/**
 * .what = scrapes detailed domain information from the domain detail page
 * .why = extracts raw domain data for transformation into domain objects
 */
export const scrapeDomainDetail = async (input: {
  page: Page;
  domain: string;
}): Promise<RawDomainDetail> => {
  const { page, domain } = input;

  // navigate to domain detail page (skip if already there)
  // .note = skip navigation to preserve in-memory state after recent mutations
  const expectedUrl = `https://account.squarespace.com/domains/managed/${domain}`;
  const currentUrlBeforeNav = page.url();
  const isAlreadyOnPage =
    currentUrlBeforeNav.includes(`/domains/managed/${domain}`) &&
    !currentUrlBeforeNav.includes('/dns');

  if (!isAlreadyOnPage) {
    await page.goto(expectedUrl);
    await page.waitForLoadState('load');
    // wait for React to render (not just body - body has noscript fallback immediately)
    await waitForSquarespaceReactRender({ page });
  }

  // fail-fast: assert URL AFTER content load
  // .note - check after content because SPA may redirect post-hydration
  const currentUrl = page.url();
  console.log('scrapeDomainDetail: final URL =', currentUrl);
  if (
    !currentUrl.includes(`/domains/managed/${domain}`) ||
    currentUrl.includes('/dns')
  ) {
    throw new Error(
      `scrapeDomainDetail: URL mismatch. expected /domains/managed/${domain} (not /dns), got ${currentUrl}. squarespace may have redirected.`,
    );
  }

  // extract domain name
  const nameElement = await page.$(domainDetailSelectors.domainName);
  const name = nameElement ? await nameElement.textContent() : domain;

  // extract status
  const statusElement = await page.$(domainDetailSelectors.domainStatus);
  const status = statusElement ? await statusElement.textContent() : 'unknown';

  // extract registrar
  const registrarElement = await page.$(domainDetailSelectors.registrarInfo);
  const registrar = registrarElement
    ? await registrarElement.textContent()
    : null;

  // extract expiration date
  const expiryElement = await page.$(domainDetailSelectors.expirationDate);
  const expirationDate = expiryElement
    ? await expiryElement.textContent()
    : null;

  // extract lock status via checkbox state
  // .note = checkbox isChecked() is more reliable than text parse
  const lockToggleInput = await page.$(domainDetailSelectors.lockToggleInput);
  const isLocked = lockToggleInput ? await lockToggleInput.isChecked() : false;

  // extract lock reason
  const lockReasonElement = await page.$(domainDetailSelectors.lockReason);
  const lockReason = lockReasonElement
    ? await lockReasonElement.textContent()
    : null;

  // extract nameservers
  const nameserverElements = await page.$$(
    domainDetailSelectors.nameserverValue,
  );
  const nameservers: string[] = [];
  for (const ns of nameserverElements) {
    const value = await ns.textContent();
    if (value) nameservers.push(value.trim());
  }

  return {
    name: (name ?? domain).trim(),
    status: (status ?? 'unknown').trim(),
    registrar: registrar?.trim() ?? null,
    expirationDate: expirationDate?.trim() ?? null,
    isLocked,
    lockReason: lockReason?.trim() ?? null,
    nameservers,
  };
};
