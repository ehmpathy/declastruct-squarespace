import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceContext,
  requireSquarespaceCredentials,
} from '../../.test/getSampleSquarespaceContext';
import { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';
import { setDomain } from './setDomain';

/**
 * .what = integration tests for setDomain domain operation
 * .why = validates domain mutation against live Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 * .note = these tests modify real domain state (lock status)
 * .note = uses 600s timeout due to cache invalidation that triggers getAllDomains re-scrape
 */
describe('setDomain', () => {
  requireSquarespaceCredentials();

  // increase jest timeout for slow UI operations
  // .note = each setDomain may trigger getAllDomains re-scrape after cache invalidation
  jest.setTimeout(600000);

  const TEST_DOMAIN = 'sunshineoceansurferturtles.com';

  // get context once before all tests
  const context = getSampleSquarespaceContext();

  given('a Squarespace account with domains', () => {
    when('setDomain upsert unlocks domain', () => {
      const result = useBeforeAll(async () => {
        const domain = await setDomain(
          { upsert: { name: TEST_DOMAIN, isLocked: false } },
          context,
        );
        return { domain };
      });

      then('returns the domain', () => {
        expect(result.domain).toBeDefined();
      });

      then('domain is a DeclaredSquarespaceDomainRegistration', () => {
        expect(result.domain).toBeInstanceOf(
          DeclaredSquarespaceDomainRegistration,
        );
      });

      then('domain is unlocked', () => {
        expect(result.domain.isLocked).toBe(false);
      });

      then('domain has correct name', () => {
        expect(result.domain.name).toBe(TEST_DOMAIN);
      });
    });

    when('setDomain upsert locks domain', () => {
      const result = useBeforeAll(async () => {
        const domain = await setDomain(
          { upsert: { name: TEST_DOMAIN, isLocked: true } },
          context,
        );
        return { domain };
      });

      then('returns the domain', () => {
        expect(result.domain).toBeDefined();
      });

      then('domain is locked', () => {
        expect(result.domain.isLocked).toBe(true);
      });
    });

    when('setDomain findsert with same state (no change needed)', () => {
      const result = useBeforeAll(async () => {
        // findsert with same state as current - should be fast (no UI toggle)
        const startTime = Date.now();
        const domain = await setDomain(
          { findsert: { name: TEST_DOMAIN, isLocked: true } },
          context,
        );
        const duration = Date.now() - startTime;
        return { domain, duration };
      });

      then('returns extant domain', () => {
        expect(result.domain).toBeDefined();
        expect(result.domain.isLocked).toBe(true);
      });

      then('findsert is faster than toggle (no UI interaction)', () => {
        // findsert with no changes should be much faster than a toggle
        // toggle takes 30+ seconds, findsert should be under 15s (cache hit)
        expect(result.duration).toBeLessThan(30000);
      });
    });

    when('setDomain upsert unlocks domain again (cleanup)', () => {
      const result = useBeforeAll(async () => {
        const domain = await setDomain(
          { upsert: { name: TEST_DOMAIN, isLocked: false } },
          context,
        );
        return { domain };
      });

      then('domain is unlocked', () => {
        expect(result.domain.isLocked).toBe(false);
      });
    });
  });
});
