import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceProvider,
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
      // get provider with real credentials
      const provider = getSampleSquarespaceProvider();

      // get a logged-in browser page
      const page = await getNewLoggedInBrowserPage(
        provider.context.agentOptions,
      );

      // track if this is a persistent browser session
      const isPersistentBrowser =
        !!provider.context.agentOptions.browser?.extantBrowserWSEndpoint;

      return { provider, page, isPersistentBrowser };
    });

    afterAll(async () => {
      // cleanup page unless persistent browser session (leave open for inspection)
      if (!scene.isPersistentBrowser) {
        await scene.page.close().catch(() => {});
        // close browser session to allow process exit
        await scene.provider.hooks.afterAll().catch(() => {});
      }
    });

    when('scraping the domains list page', () => {
      const result = useBeforeAll(async () => {
        const domains = await scrapeDomainsList({ page: scene.page });
        return { domains };
      });

      then('returns at least one domain', async () => {
        console.log('domains found:', result.domains);
        expect(Array.isArray(result.domains)).toBe(true);
        expect(result.domains.length).toBeGreaterThan(0);
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
