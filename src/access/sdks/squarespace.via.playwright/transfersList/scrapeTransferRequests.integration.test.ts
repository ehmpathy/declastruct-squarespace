import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceContext,
  requireSquarespaceCredentials,
} from '../../../../.test/getSampleSquarespaceContext';
import { getNewLoggedInBrowserPage } from '../browser/getNewLoggedInBrowserPage';
import {
  type RawTransferRequest,
  scrapeTransferRequests,
} from './scrapeTransferRequests';

/**
 * .what = integration tests for scrapeTransferRequests
 * .why = validates real browser scrape of transfer requests against live Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 */
describe('scrapeTransferRequests', () => {
  // fail-fast if credentials not provided
  requireSquarespaceCredentials();

  given('a logged-in browser session', () => {
    const scene = useBeforeAll(async () => {
      // get context with real credentials
      const context = getSampleSquarespaceContext();

      // get a logged-in browser page
      const page = await getNewLoggedInBrowserPage(context.agentOptions);

      return { context, page };
    });

    afterAll(async () => {
      // cleanup browser page
      await scene.page.close().catch(() => {});
    });

    when('scraping the transfers list page', () => {
      const result = useBeforeAll(async () => {
        const transfers = await scrapeTransferRequests({ page: scene.page });
        return { transfers };
      });

      then('returns an array of transfer requests', async () => {
        expect(Array.isArray(result.transfers)).toBe(true);
      });

      then('if transfers exist, each has a domain name', async () => {
        // transfers may be empty if no active transfers
        result.transfers.forEach((t: RawTransferRequest) => {
          expect(typeof t.domainName).toBe('string');
        });
      });

      then('if transfers exist, each has a status', async () => {
        // transfers may be empty if no active transfers
        result.transfers.forEach((t: RawTransferRequest) => {
          expect(typeof t.status).toBe('string');
        });
      });

      then('transfer domain names look like valid domains', async () => {
        result.transfers.forEach((t: RawTransferRequest) => {
          if (t.domainName.length > 0) {
            // should contain at least one dot (e.g., example.com)
            expect(t.domainName).toMatch(/\./);
          }
        });
      });
    });
  });
});
