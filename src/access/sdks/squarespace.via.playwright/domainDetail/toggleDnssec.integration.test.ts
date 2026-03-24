import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceContext,
  requireSquarespaceCredentials,
} from '../../../../.test/getSampleSquarespaceContext';
import { getNewLoggedInBrowserPage } from '../browser/getNewLoggedInBrowserPage';
import { toggleDnssec } from './toggleDnssec';

/**
 * .what = integration tests for toggleDnssec scraper
 * .why = validates DNSSEC enable/disable operations against live Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 */
describe('toggleDnssec', () => {
  requireSquarespaceCredentials();

  const TEST_DOMAIN = 'sunshineoceansurferturtles.com';

  given('a logged-in browser session', () => {
    const scene = useBeforeAll(async () => {
      const context = getSampleSquarespaceContext();
      const page = await getNewLoggedInBrowserPage(context.agentOptions);
      return { context, page };
    });

    afterAll(async () => {
      await scene.page.close().catch(() => {});
    });

    when('disable is requested', () => {
      const result = useBeforeAll(async () => {
        const disableResult = await toggleDnssec({
          page: scene.page,
          domain: TEST_DOMAIN,
          targetState: 'disabled',
          credentials: scene.context.agentOptions.credentials,
        });
        return { disableResult };
      });

      then('returns success', () => {
        expect(result.disableResult.success).toBe(true);
      });

      then('new state is disabled', () => {
        expect(result.disableResult.newState).toBe('disabled');
      });
    });

    when('enable is requested', () => {
      const result = useBeforeAll(async () => {
        const enableResult = await toggleDnssec({
          page: scene.page,
          domain: TEST_DOMAIN,
          targetState: 'enabled',
          credentials: scene.context.agentOptions.credentials,
        });
        return { enableResult };
      });

      then('returns success', () => {
        expect(result.enableResult.success).toBe(true);
      });

      then('new state is enabled', () => {
        expect(result.enableResult.newState).toBe('enabled');
      });
    });

    when('disable is requested on already disabled domain (idempotent)', () => {
      const result = useBeforeAll(async () => {
        // first disable
        await toggleDnssec({
          page: scene.page,
          domain: TEST_DOMAIN,
          targetState: 'disabled',
          credentials: scene.context.agentOptions.credentials,
        });
        // second disable (should be no-op)
        const secondResult = await toggleDnssec({
          page: scene.page,
          domain: TEST_DOMAIN,
          targetState: 'disabled',
          credentials: scene.context.agentOptions.credentials,
        });
        return { secondResult };
      });

      then('returns success', () => {
        expect(result.secondResult.success).toBe(true);
      });

      then('state remains disabled', () => {
        expect(result.secondResult.newState).toBe('disabled');
      });

      then('second call was a no-op (no toggle occurred)', () => {
        expect(result.secondResult.wasNoOp).toBe(true);
      });
    });
  });
});
