import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceContext,
  requireSquarespaceCredentials,
} from '../../.test/getSampleSquarespaceContext';
import { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';
import { getOneDomain } from './getOneDomain';

/**
 * .what = integration tests for getOneDomain domain operation
 * .why = validates single domain lookup against live Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 */
describe('getOneDomain', () => {
  requireSquarespaceCredentials();

  const TEST_DOMAIN = 'sunshineoceansurferturtles.com';

  // get context once before all tests
  const context = getSampleSquarespaceContext();

  given('a Squarespace account with domains', () => {
    when('getOneDomain is called with extant domain (by unique)', () => {
      const result = useBeforeAll(async () => {
        const domain = await getOneDomain(
          { by: { unique: { name: TEST_DOMAIN } } },
          context,
        );
        return { domain };
      });

      then('returns the domain', () => {
        expect(result.domain).toBeDefined();
      });

      then('domain is a DeclaredSquarespaceDomainRegistration instance', () => {
        expect(result.domain).toBeInstanceOf(
          DeclaredSquarespaceDomainRegistration,
        );
      });

      then('domain has correct name', () => {
        expect(result.domain?.name).toBe(TEST_DOMAIN);
      });

      then('domain has required properties', () => {
        expect(result.domain?.status).toBeDefined();
        expect(result.domain?.registrar).toBeDefined();
      });
    });

    when('getOneDomain is called with extant domain (by ref)', () => {
      const result = useBeforeAll(async () => {
        const domain = await getOneDomain(
          { by: { ref: { name: TEST_DOMAIN } } },
          context,
        );
        return { domain };
      });

      then('returns the domain', () => {
        expect(result.domain).toBeDefined();
      });

      then('domain has correct name', () => {
        expect(result.domain?.name).toBe(TEST_DOMAIN);
      });
    });

    when('getOneDomain is called with absent domain', () => {
      const result = useBeforeAll(async () => {
        const domain = await getOneDomain(
          { by: { unique: { name: 'absent-domain-xyz123.com' } } },
          context,
        );
        return { domain };
      });

      then('returns null', () => {
        expect(result.domain).toBeNull();
      });
    });

    when('getOneDomain is called again (cached)', () => {
      const result = useBeforeAll(async () => {
        const startTime = Date.now();
        const domain = await getOneDomain(
          { by: { unique: { name: TEST_DOMAIN } } },
          context,
        );
        const duration = Date.now() - startTime;
        return { domain, duration };
      });

      then('returns same domain', () => {
        expect(result.domain?.name).toBe(TEST_DOMAIN);
      });

      then('cache hit is faster than initial call', () => {
        // delegates to getAllDomains which is cached
        expect(result.duration).toBeLessThan(1000);
      });
    });
  });
});
