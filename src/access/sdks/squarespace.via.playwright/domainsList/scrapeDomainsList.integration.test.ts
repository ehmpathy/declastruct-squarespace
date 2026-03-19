import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceContext,
  requireSquarespaceCredentials,
} from '../../../../.test/getSampleSquarespaceContext';
import { getNewLoggedInBrowserPage } from '../browser/getNewLoggedInBrowserPage';
import { type RawDomainListItem, scrapeDomainsList } from './scrapeDomainsList';

/**
 * .what = integration tests for scrapeDomainsList
 * .why = validates real browser scrape against live Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 */
describe('scrapeDomainsList', () => {
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

    when('scraping the domains list page', () => {
      const result = useBeforeAll(async () => {
        const domains = await scrapeDomainsList({ page: scene.page });
        return { domains };
      });

      then('returns an array of domains', async () => {
        expect(Array.isArray(result.domains)).toBe(true);
      });

      then('each domain has a name', async () => {
        result.domains.forEach((d: RawDomainListItem) => {
          expect(typeof d.name).toBe('string');
          expect(d.name.length).toBeGreaterThan(0);
        });
      });

      then('each domain has a status', async () => {
        result.domains.forEach((d: RawDomainListItem) => {
          expect(typeof d.status).toBe('string');
          expect(d.status.length).toBeGreaterThan(0);
        });
      });

      then('domain names look like valid domains', async () => {
        result.domains.forEach((d: RawDomainListItem) => {
          // should contain at least one dot (e.g., example.com)
          expect(d.name).toMatch(/\./);
        });
      });
    });
  });
});
