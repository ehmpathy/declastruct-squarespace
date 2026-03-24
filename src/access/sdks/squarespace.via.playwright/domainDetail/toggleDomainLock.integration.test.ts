import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceContext,
  requireSquarespaceCredentials,
} from '../../../../.test/getSampleSquarespaceContext';
import { getNewLoggedInBrowserPage } from '../browser/getNewLoggedInBrowserPage';
import { toggleDomainLock } from './toggleDomainLock';

/**
 * .what = integration tests for toggleDomainLock scraper
 * .why = validates lock/unlock operations against live Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 */
describe('toggleDomainLock', () => {
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

    when('unlock is requested', () => {
      const result = useBeforeAll(async () => {
        const unlockResult = await toggleDomainLock({
          page: scene.page,
          domain: TEST_DOMAIN,
          targetState: 'unlocked',
          credentials: scene.context.agentOptions.credentials,
        });
        return { unlockResult };
      });

      then('returns success', () => {
        expect(result.unlockResult.success).toBe(true);
      });

      then('new state is unlocked', () => {
        expect(result.unlockResult.newState).toBe('unlocked');
      });
    });

    when('lock is requested', () => {
      const result = useBeforeAll(async () => {
        const lockResult = await toggleDomainLock({
          page: scene.page,
          domain: TEST_DOMAIN,
          targetState: 'locked',
          credentials: scene.context.agentOptions.credentials,
        });
        return { lockResult };
      });

      then('returns success', () => {
        expect(result.lockResult.success).toBe(true);
      });

      then('new state is locked', () => {
        expect(result.lockResult.newState).toBe('locked');
      });
    });

    when('unlock is requested on already unlocked domain (idempotent)', () => {
      const result = useBeforeAll(async () => {
        // first unlock
        await toggleDomainLock({
          page: scene.page,
          domain: TEST_DOMAIN,
          targetState: 'unlocked',
          credentials: scene.context.agentOptions.credentials,
        });
        // second unlock (should be no-op)
        const secondResult = await toggleDomainLock({
          page: scene.page,
          domain: TEST_DOMAIN,
          targetState: 'unlocked',
          credentials: scene.context.agentOptions.credentials,
        });
        return { secondResult };
      });

      then('returns success', () => {
        expect(result.secondResult.success).toBe(true);
      });

      then('state remains unlocked', () => {
        expect(result.secondResult.newState).toBe('unlocked');
      });

      then('second call was a no-op (no toggle occurred)', () => {
        expect(result.secondResult.wasNoOp).toBe(true);
      });
    });
  });
});
