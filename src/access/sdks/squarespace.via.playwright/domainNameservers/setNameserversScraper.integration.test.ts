import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceContext,
  requireSquarespaceCredentials,
} from '../../../../.test/getSampleSquarespaceContext';
import { getNewLoggedInBrowserPage } from '../browser/getNewLoggedInBrowserPage';
import { setNameserversScraper } from './setNameserversScraper';

/**
 * .what = integration tests for setNameserversScraper communicator
 * .why = validates nameserver operations against live Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 */
describe('setNameserversScraper', () => {
  requireSquarespaceCredentials();

  const TEST_DOMAIN = 'sunshineoceansurferturtles.com';
  const CLOUDFLARE_NS = ['ns1.cloudflare.com', 'ns2.cloudflare.com'];

  given('a logged-in browser session', () => {
    const scene = useBeforeAll(async () => {
      const context = getSampleSquarespaceContext();
      const page = await getNewLoggedInBrowserPage(context.agentOptions);
      return { context, page };
    });

    afterAll(async () => {
      await scene.page.close().catch(() => {});
    });

    when('custom nameservers are set', () => {
      const result = useBeforeAll(async () => {
        const setResult = await setNameserversScraper({
          page: scene.page,
          domain: TEST_DOMAIN,
          nameservers: CLOUDFLARE_NS,
          credentials: scene.context.agentOptions.credentials,
        });
        return { setResult };
      });

      then('returns success', () => {
        expect(result.setResult.success).toBe(true);
      });

      then('nameservers is custom array', () => {
        expect(result.setResult.nameservers).toEqual(CLOUDFLARE_NS);
      });

      then('full result matches snapshot', () => {
        // snapshot full return value for exhaustive regression detection
        expect(result.setResult).toMatchSnapshot();
      });
    });

    when('reset to squarespace default', () => {
      const result = useBeforeAll(async () => {
        const resetResult = await setNameserversScraper({
          page: scene.page,
          domain: TEST_DOMAIN,
          nameservers: null,
          credentials: scene.context.agentOptions.credentials,
        });
        return { resetResult };
      });

      then('returns success', () => {
        expect(result.resetResult.success).toBe(true);
      });

      then('nameservers is null (squarespace default)', () => {
        expect(result.resetResult.nameservers).toBeNull();
      });

      then('full result matches snapshot', () => {
        // snapshot full return value for exhaustive regression detection
        expect(result.resetResult).toMatchSnapshot();
      });
    });

    when('called for non-extant domain', () => {
      const result = useBeforeAll(async () => {
        let error: Error | null = null;
        let setResult: {
          success: boolean;
          nameservers: string[] | null;
        } | null = null;
        try {
          setResult = await setNameserversScraper({
            page: scene.page,
            domain: 'non-extant-domain-12345.com',
            nameservers: CLOUDFLARE_NS,
            credentials: scene.context.agentOptions.credentials,
          });
        } catch (e) {
          error = e as Error;
        }
        return { setResult, error };
      });

      then('returns error or fails', () => {
        // operation should either throw error or return success: false
        const hasError = result.error !== null;
        const hasFailed = result.setResult?.success === false;
        expect(hasError || hasFailed).toBe(true);
      });

      then('full result matches snapshot', () => {
        // snapshot full return value for exhaustive regression detection
        expect(result.setResult).toMatchSnapshot();
      });

      then('error matches snapshot', () => {
        // snapshot error details for regression detection
        expect({
          errorName: result.error?.name ?? null,
          errorMessage: result.error?.message?.split('\n')[0] ?? null,
        }).toMatchSnapshot();
      });
    });
  });
});
