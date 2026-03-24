import type { Page } from 'playwright';

import { waitForSquarespaceReactRender } from '../navigation/waitForSquarespaceReactRender';
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
  // .note - use 'load' not 'networkidle' because squarespace SPA has persistent connections
  // .note - URL pattern is /domains/managed/{domain}/dns/dns-settings (the actual DNS records page)
  // .note - /domains/managed/{domain}/dns alone redirects to the domains list (invalid route)
  const expectedUrl = `https://account.squarespace.com/domains/managed/${domain}/dns/dns-settings`;
  await page.goto(expectedUrl);
  await page.waitForLoadState('load');

  // wait for React to render shell + DNS record rows
  await waitForSquarespaceReactRender({
    page,
    forContent: '[data-testid="dns-record-row"]',
  });
  console.log('scrapeDnsRecords: DNS records table rendered');

  // fail-fast: assert URL AFTER content load
  // .note - check after content because SPA may redirect post-hydration
  const currentUrl = page.url();
  console.log('scrapeDnsRecords: final URL =', currentUrl);
  if (!currentUrl.includes(`/domains/managed/${domain}/dns/dns-settings`)) {
    throw new Error(
      `scrapeDnsRecords: unexpected URL after navigation. expected ${expectedUrl}, got ${currentUrl}. squarespace may have redirected.`,
    );
  }

  // check for container or empty state
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

  // try to find records - if table not found, try alternative selectors
  const recordsTableFound = await page
    .$(dnsSettingsSelectors.recordsTable)
    .then((el) => el !== null);

  console.log('scrapeDnsRecords: recordsTableFound =', recordsTableFound);

  // if no records table found, check for any table or list structure
  if (!recordsTableFound) {
    // try alternative selector patterns that might contain DNS records
    const hasAnyTable = await page.$('table').then((el) => el !== null);
    const hasRecordsList = await page
      .$('[class*="record"], [class*="dns"]')
      .then((el) => el !== null);

    console.log(
      'scrapeDnsRecords: hasAnyTable =',
      hasAnyTable,
      'hasRecordsList =',
      hasRecordsList,
    );

    // debug: dump all tables and main content
    const allTables = await page.$$eval('table', (els) =>
      els.map((el) => el.outerHTML.slice(0, 500)),
    );
    console.log('scrapeDnsRecords: all tables:', allTables);

    // debug: dump main content structure
    const mainContent = await page
      .$eval('main', (el) => el.innerHTML.slice(0, 3000))
      .catch(() => 'no main found');
    console.log('scrapeDnsRecords: main content preview:', mainContent);

    // if still no structured content, fail fast with debug info
    if (!hasAnyTable && !hasRecordsList) {
      // capture page content for debug
      const bodyText = await page.locator('body').textContent();
      const truncatedBody = bodyText?.slice(0, 500) ?? '';
      throw new Error(
        `scrapeDnsRecords: no DNS records structure found on page. URL=${currentUrl}. body preview: ${truncatedBody}`,
      );
    }
  }

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
