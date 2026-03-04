import type { Page } from 'playwright';

import { dnsSettingsSelectors } from '../selectors/dnsSettingsSelectors';

/**
 * .what = raw DNS record data scraped from DNS settings page
 * .why = pre-cast shape before transforming to domain object
 */
export interface RawDnsRecord {
  type: string;
  host: string;
  value: string;
  ttl: string | null;
  priority: string | null;
}

/**
 * .what = scrapes all DNS records from the domain's DNS settings page
 * .why = extracts raw DNS data for transformation into domain objects
 */
export const scrapeDnsRecords = async (input: {
  page: Page;
  domain: string;
}): Promise<RawDnsRecord[]> => {
  const { page, domain } = input;

  // navigate to dns settings page
  await page.goto(`https://account.squarespace.com/domains/${domain}/dns`);
  await page.waitForLoadState('networkidle');

  // wait for container or empty state
  const containerVisible = await page
    .$(dnsSettingsSelectors.container)
    .then((el) => el !== null);
  const emptyStateVisible = await page
    .$(dnsSettingsSelectors.emptyState)
    .then((el) => el !== null);

  // return empty array if no records
  if (emptyStateVisible && !containerVisible) {
    return [];
  }

  // wait for records table to load
  await page.waitForSelector(dnsSettingsSelectors.recordsTable, {
    timeout: 30000,
  });

  // scrape all record rows
  const recordRows = await page.$$(dnsSettingsSelectors.recordRow);
  const records: RawDnsRecord[] = [];

  for (const row of recordRows) {
    // extract record fields
    const typeElement = await row.$(dnsSettingsSelectors.recordType);
    const hostElement = await row.$(dnsSettingsSelectors.recordHost);
    const valueElement = await row.$(dnsSettingsSelectors.recordValue);
    const ttlElement = await row.$(dnsSettingsSelectors.recordTtl);
    const priorityElement = await row.$(dnsSettingsSelectors.recordPriority);

    const type = typeElement ? await typeElement.textContent() : '';
    const host = hostElement ? await hostElement.textContent() : '';
    const value = valueElement ? await valueElement.textContent() : '';
    const ttl = ttlElement ? await ttlElement.textContent() : null;
    const priority = priorityElement
      ? await priorityElement.textContent()
      : null;

    records.push({
      type: (type ?? '').trim(),
      host: (host ?? '').trim(),
      value: (value ?? '').trim(),
      ttl: ttl?.trim() ?? null,
      priority: priority?.trim() ?? null,
    });
  }

  return records;
};
