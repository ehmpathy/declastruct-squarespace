import { given, then, when, useBeforeAll } from 'test-fns';

import {
  getSampleSquarespaceContext,
  hasSquarespaceCredentials,
} from '../../../../.test/getSampleSquarespaceContext';
import { getNewLoggedInBrowserPage } from '../browser/getNewLoggedInBrowserPage';
import { scrapeDomainsList } from '../domainsList/scrapeDomainsList';
import { scrapeDnsRecords, type RawDnsRecord } from './scrapeDnsRecords';

/**
 * .what = integration tests for scrapeDnsRecords
 * .why = validates real browser scraping of DNS records against live Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 */
describe('scrapeDnsRecords', () => {
  // skip if credentials not provided
  if (!hasSquarespaceCredentials()) {
    it.skip('skipped - credentials not provided', () => {});
    return;
  }

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

    afterAll(async () => {
      // cleanup browser page
      await scene.page.close().catch(() => {});
    });

    when('scraping DNS records for a domain', () => {
      const result = useBeforeAll(async () => {
        const records = await scrapeDnsRecords({
          page: scene.page,
          domain: scene.testDomain,
        });
        return { records };
      });

      then('returns an array of DNS records', async () => {
        expect(Array.isArray(result.records)).toBe(true);
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
