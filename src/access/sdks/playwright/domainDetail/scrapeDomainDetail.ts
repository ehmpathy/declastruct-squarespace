import type { Page } from 'playwright';

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

  // navigate to domain detail page
  await page.goto(`https://account.squarespace.com/domains/${domain}/overview`);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector(domainDetailSelectors.container, {
    timeout: 30000,
  });

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

  // extract lock status
  const lockStatusElement = await page.$(domainDetailSelectors.lockStatus);
  const lockStatusText = lockStatusElement
    ? await lockStatusElement.textContent()
    : '';
  const isLocked =
    (lockStatusText?.toLowerCase().includes('locked') ?? false) &&
    !lockStatusText?.toLowerCase().includes('unlocked');

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
