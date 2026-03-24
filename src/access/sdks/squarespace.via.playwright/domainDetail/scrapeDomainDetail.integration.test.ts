import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceContext,
  requireSquarespaceCredentials,
} from '../../../../.test/getSampleSquarespaceContext';
import { getNewLoggedInBrowserPage } from '../browser/getNewLoggedInBrowserPage';
import { scrapeDomainsList } from '../domainsList/scrapeDomainsList';
import { type RawDomainDetail, scrapeDomainDetail } from './scrapeDomainDetail';

/**
 * .what = integration tests for scrapeDomainDetail
 * .why = validates real browser scrape of domain details against live Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 */
describe('scrapeDomainDetail', () => {
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
        throw new Error(
          'no domains in account - cannot test scrapeDomainDetail',
        );
      }

      // use first domain for testing
      const testDomain = domainsList[0]!.name;

      return { context, page, testDomain };
    });

    afterAll(async () => {
      // cleanup browser page
      await scene.page.close().catch(() => {});
    });

    when('scraping a domain detail page', () => {
      const result = useBeforeAll(async () => {
        const detail = await scrapeDomainDetail({
          page: scene.page,
          domain: scene.testDomain,
        });
        return { detail };
      });

      then('returns domain detail object', async () => {
        expect(result.detail).toBeDefined();
        expect(typeof result.detail).toBe('object');
      });

      then('detail has the correct domain name', async () => {
        const detail: RawDomainDetail = result.detail;
        expect(detail.name.toLowerCase()).toBe(scene.testDomain.toLowerCase());
      });

      then('detail has a status', async () => {
        const detail: RawDomainDetail = result.detail;
        expect(typeof detail.status).toBe('string');
        expect(detail.status.length).toBeGreaterThan(0);
      });

      then('detail has isLocked boolean', async () => {
        const detail: RawDomainDetail = result.detail;
        expect(typeof detail.isLocked).toBe('boolean');
      });

      then('detail has nameservers array', async () => {
        const detail: RawDomainDetail = result.detail;
        expect(Array.isArray(detail.nameservers)).toBe(true);
      });
    });
  });
});
