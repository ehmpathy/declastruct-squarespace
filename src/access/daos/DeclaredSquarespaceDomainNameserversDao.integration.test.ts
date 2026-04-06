import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceContext,
  requireSquarespaceCredentials,
} from '../../.test/getSampleSquarespaceContext';
import { DeclaredSquarespaceDomainNameservers } from '../../domain.objects/DeclaredSquarespaceDomainNameservers';
import { DeclaredSquarespaceDomainNameserversDao } from './DeclaredSquarespaceDomainNameserversDao';

/**
 * .what = integration tests for DeclaredSquarespaceDomainNameserversDao
 * .why = validates DAO operations against live Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 */
describe('DeclaredSquarespaceDomainNameserversDao', () => {
  requireSquarespaceCredentials();

  // increase jest timeout for slow UI operations
  jest.setTimeout(600000);

  const TEST_DOMAIN = 'sunshineoceansurferturtles.com';
  const CLOUDFLARE_NS = ['ns1.cloudflare.com', 'ns2.cloudflare.com'];

  // get context once before all tests
  const context = getSampleSquarespaceContext();

  given('a Squarespace account with domains', () => {
    when('get.one.byUnique is called', () => {
      const result = useBeforeAll(async () => {
        const ns =
          await DeclaredSquarespaceDomainNameserversDao.get.one.byUnique(
            { domain: { name: TEST_DOMAIN } },
            context,
          );
        return { ns };
      });

      then('returns entity', () => {
        expect(result.ns).toBeDefined();
        expect(result.ns).toBeInstanceOf(DeclaredSquarespaceDomainNameservers);
      });

      then('entity has correct domain reference', () => {
        expect(result.ns?.domain.name).toBe(TEST_DOMAIN);
      });

      then('full entity matches snapshot', () => {
        // snapshot full return value for exhaustive regression detection
        expect(result.ns).toMatchSnapshot();
      });
    });

    when('set.upsert is called with custom nameservers', () => {
      const result = useBeforeAll(async () => {
        const ns = await DeclaredSquarespaceDomainNameserversDao.set.upsert!(
          {
            domain: { name: TEST_DOMAIN },
            nameservers: CLOUDFLARE_NS,
          },
          context,
        );
        return { ns };
      });

      then('returns entity with custom nameservers', () => {
        expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS);
      });

      then('full entity matches snapshot', () => {
        // snapshot full return value for exhaustive regression detection
        expect(result.ns).toMatchSnapshot();
      });
    });

    when('set.upsert is called with null (reset to default)', () => {
      const result = useBeforeAll(async () => {
        const ns = await DeclaredSquarespaceDomainNameserversDao.set.upsert!(
          {
            domain: { name: TEST_DOMAIN },
            nameservers: null,
          },
          context,
        );
        return { ns };
      });

      then('returns entity with null nameservers', () => {
        expect(result.ns.nameservers).toBeNull();
      });

      then('full entity matches snapshot', () => {
        // snapshot full return value for exhaustive regression detection
        expect(result.ns).toMatchSnapshot();
      });
    });

    when('set.findsert is called with same state', () => {
      const result = useBeforeAll(async () => {
        // get current state
        const current =
          await DeclaredSquarespaceDomainNameserversDao.get.one.byUnique(
            { domain: { name: TEST_DOMAIN } },
            context,
          );

        // findsert with same state
        const startTime = Date.now();
        const ns = await DeclaredSquarespaceDomainNameserversDao.set.findsert(
          {
            domain: { name: TEST_DOMAIN },
            nameservers: current?.nameservers ?? null,
          },
          context,
        );
        const duration = Date.now() - startTime;

        return { current, ns, duration };
      });

      then('returns extant entity', () => {
        expect(result.ns).toBeDefined();
        expect(result.ns.nameservers).toEqual(
          result.current?.nameservers ?? null,
        );
      });

      then('findsert is faster than upsert (no change needed)', () => {
        // findsert with no changes should skip UI interaction
        expect(result.duration).toBeLessThan(30000);
      });

      then('full entity matches snapshot', () => {
        // snapshot full return value for exhaustive regression detection
        expect(result.ns).toMatchSnapshot();
      });
    });

    when('get.one.byUnique is called for non-extant domain', () => {
      const result = useBeforeAll(async () => {
        let ns: DeclaredSquarespaceDomainNameservers | null = null;
        let error: Error | null = null;
        try {
          ns = await DeclaredSquarespaceDomainNameserversDao.get.one.byUnique(
            { domain: { name: 'non-extant-domain-12345.com' } },
            context,
          );
        } catch (e) {
          error = e as Error;
        }
        return { ns, error };
      });

      then('returns null or throws error', () => {
        // operation either returns null or throws error for non-extant domain
        const isNullResult = result.ns === null;
        const isErrorResult = result.error !== null;
        expect(isNullResult || isErrorResult).toBe(true);
      });

      then('full result matches snapshot', () => {
        // snapshot full return value for exhaustive regression detection
        expect(result.ns).toMatchSnapshot();
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
