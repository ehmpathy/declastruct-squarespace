import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceContext,
  requireSquarespaceCredentials,
} from '../../../../.test/getSampleSquarespaceContext';
import { getNewLoggedInBrowserPage } from '../browser/getNewLoggedInBrowserPage';
import { scrapeDomainsList } from '../domainsList/scrapeDomainsList';
import { type RawDnsRecord, scrapeDnsRecords } from './scrapeDnsRecords';

/**
 * .what = integration tests for scrapeDnsRecords
 * .why = validates real browser scrape of DNS records against live Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 */
describe('scrapeDnsRecords', () => {
  // fail-fast if credentials not provided
  requireSquarespaceCredentials();

  given('a logged-in browser session with at least one domain', () => {
    const scene = useBeforeAll(async () => {
      // get context with real credentials
      const context = getSampleSquarespaceContext();

      // get a logged-in browser page
      const page = await getNewLoggedInBrowserPage(context.agentOptions);

      // get list of domains to find a valid domain name
      const domainsList = await scrapeDomainsList({ page });

      // skip if no domains in account
      if (domainsList.length === 0) {
        throw new Error('no domains in account - cannot test scrapeDnsRecords');
      }

      // use first domain for testing
      const testDomain = domainsList[0]!.name;

      return { context, page, testDomain };
    });

    // .note - do NOT close page; leave it open for human/robot to inspect after test
    // afterAll(async () => await scene.page.close().catch(() => {}));

    when('scraping DNS records for a domain', () => {
      const result = useBeforeAll(async () => {
        const records = await scrapeDnsRecords({
          page: scene.page,
          domain: scene.testDomain,
        });
        return { records };
      });

      then('returns a non-empty array of DNS records', async () => {
        console.log('dns records found:', result.records);
        expect(Array.isArray(result.records)).toBe(true);
        expect(result.records.length).toBeGreaterThan(0);
      });

      then('each record has a type', async () => {
        result.records.forEach((r: RawDnsRecord) => {
          expect(typeof r.type).toBe('string');
        });
      });

      then('each record has a host', async () => {
        result.records.forEach((r: RawDnsRecord) => {
          expect(typeof r.host).toBe('string');
        });
      });

      then('each record has a value', async () => {
        result.records.forEach((r: RawDnsRecord) => {
          expect(typeof r.value).toBe('string');
        });
      });

      then('record types are valid DNS types', async () => {
        const validTypes = [
          'A',
          'AAAA',
          'CNAME',
          'MX',
          'TXT',
          'NS',
          'SRV',
          'CAA',
          'HTTPS',
        ];
        result.records.forEach((r: RawDnsRecord) => {
          // type might have extra text, check if it starts with a valid type
          const hasValidType = validTypes.some(
            (t) =>
              r.type.toUpperCase().includes(t) || r.type.toUpperCase() === t,
          );
          expect(hasValidType).toBe(true);
        });
      });
    });
  });
});
