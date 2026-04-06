import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceContext,
  requireSquarespaceCredentials,
} from '../../.test/getSampleSquarespaceContext';
import { DeclaredSquarespaceDomainNameservers } from '../../domain.objects/DeclaredSquarespaceDomainNameservers';
import { getNameservers } from './getNameservers';
import { setNameservers } from './setNameservers';

/**
 * .what = journey tests for setNameservers domain operation
 * .why = validates nameserver swap to cloudflare and back to squarespace default
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 * .note = these tests modify real domain state (nameservers)
 */
describe('setNameservers', () => {
  requireSquarespaceCredentials();

  // increase jest timeout for slow UI operations
  jest.setTimeout(600000);

  const TEST_DOMAIN = 'sunshineoceansurferturtles.com';
  const CLOUDFLARE_NS = ['ns1.cloudflare.com', 'ns2.cloudflare.com'];

  // get context once before all tests
  const context = getSampleSquarespaceContext();

  given('[case1] domain with squarespace default nameservers', () => {
    // first reset to squarespace default to establish known state
    const initial = useBeforeAll(async () => {
      const ns = await setNameservers(
        {
          upsert: {
            domain: { name: TEST_DOMAIN },
            nameservers: null,
          },
        },
        context,
      );
      return { ns };
    });

    when('[t0] before any changes', () => {
      then('getNameservers returns entity', () => {
        expect(initial.ns).toBeDefined();
        expect(initial.ns).toBeInstanceOf(DeclaredSquarespaceDomainNameservers);
      });

      then('nameservers is null (squarespace default)', () => {
        expect(initial.ns.nameservers).toBeNull();
      });

      then('full entity matches snapshot (null case)', () => {
        // snapshot full return value for exhaustive regression detection
        expect(initial.ns).toMatchSnapshot();
      });
    });

    when('[t1] setNameservers upsert to cloudflare', () => {
      const result = useBeforeAll(async () => {
        const ns = await setNameservers(
          {
            upsert: {
              domain: { name: TEST_DOMAIN },
              nameservers: CLOUDFLARE_NS,
            },
          },
          context,
        );
        return { ns };
      });

      then('returns entity with custom nameservers', () => {
        expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS);
      });

      then('full entity matches snapshot (custom case)', () => {
        // snapshot full return value for exhaustive regression detection
        expect(result.ns).toMatchSnapshot();
      });
    });

    when('[t2] getNameservers after change', () => {
      const result = useBeforeAll(async () => {
        const ns = await getNameservers(
          { by: { unique: { domain: { name: TEST_DOMAIN } } } },
          context,
        );
        return { ns };
      });

      then('returns entity with custom nameservers', () => {
        expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS);
      });
    });

    when('[t3] setNameservers upsert back to null', () => {
      const result = useBeforeAll(async () => {
        const ns = await setNameservers(
          {
            upsert: {
              domain: { name: TEST_DOMAIN },
              nameservers: null,
            },
          },
          context,
        );
        return { ns };
      });

      then('returns entity with null nameservers', () => {
        expect(result.ns.nameservers).toBeNull();
      });
    });

    when('[t4] getNameservers after reset', () => {
      const result = useBeforeAll(async () => {
        const ns = await getNameservers(
          { by: { unique: { domain: { name: TEST_DOMAIN } } } },
          context,
        );
        return { ns };
      });

      then('returns entity with null nameservers', () => {
        expect(result.ns.nameservers).toBeNull();
      });
    });
  });

  given('[case2] idempotent upsert (same values)', () => {
    // first set cloudflare nameservers
    const setup = useBeforeAll(async () => {
      const ns = await setNameservers(
        {
          upsert: {
            domain: { name: TEST_DOMAIN },
            nameservers: CLOUDFLARE_NS,
          },
        },
        context,
      );
      return { ns };
    });

    when('[t0] upsert with same nameservers already set', () => {
      const result = useBeforeAll(async () => {
        // upsert again with the SAME values
        const ns = await setNameservers(
          {
            upsert: {
              domain: { name: TEST_DOMAIN },
              nameservers: CLOUDFLARE_NS,
            },
          },
          context,
        );
        return { ns };
      });

      then('returns entity with same nameservers', () => {
        expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS);
      });

      then('setup had same values', () => {
        expect(setup.ns.nameservers).toEqual(CLOUDFLARE_NS);
      });
    });

    when('[t1] verify via getNameservers', () => {
      const result = useBeforeAll(async () => {
        const ns = await getNameservers(
          { by: { unique: { domain: { name: TEST_DOMAIN } } } },
          context,
        );
        return { ns };
      });

      then('nameservers remain unchanged', () => {
        expect(result.ns.nameservers).toEqual(CLOUDFLARE_NS);
      });
    });

    // reset to null for next test
    useBeforeAll(async () => {
      await setNameservers(
        {
          upsert: {
            domain: { name: TEST_DOMAIN },
            nameservers: null,
          },
        },
        context,
      );
      return {};
    });
  });

  given('[case3] findsert semantics', () => {
    when('[t0] findsert with same state as current', () => {
      const result = useBeforeAll(async () => {
        // get current state
        const current = await getNameservers(
          { by: { unique: { domain: { name: TEST_DOMAIN } } } },
          context,
        );

        // findsert with same state
        const startTime = Date.now();
        const ns = await setNameservers(
          {
            findsert: {
              domain: { name: TEST_DOMAIN },
              nameservers: current.nameservers,
            },
          },
          context,
        );
        const duration = Date.now() - startTime;

        return { current, ns, duration };
      });

      then('returns extant entity unchanged', () => {
        expect(result.ns.nameservers).toEqual(result.current.nameservers);
      });

      then('findsert is faster than upsert (no UI interaction)', () => {
        // findsert with no changes should be much faster
        expect(result.duration).toBeLessThan(30000);
      });
    });
  });

  given('[case4] validation errors', () => {
    when('[t0] fewer than 2 nameservers', () => {
      const result = useBeforeAll(async () => {
        let ns: DeclaredSquarespaceDomainNameservers | null = null;
        let error: Error | null = null;
        try {
          ns = await setNameservers(
            {
              upsert: {
                domain: { name: TEST_DOMAIN },
                nameservers: ['ns1.cloudflare.com'], // only 1 nameserver
              },
            },
            context,
          );
        } catch (e) {
          error = e as Error;
        }
        return { ns, error };
      });

      then('throws validation error', () => {
        expect(result.error).not.toBeNull();
      });

      then('full result matches snapshot', () => {
        // snapshot full return value for exhaustive regression detection
        expect(result.ns).toMatchSnapshot();
      });

      then('error matches snapshot', () => {
        // snapshot error details for regression detection
        expect({
          errorName: result.error?.name ?? null,
          errorMessage: result.error?.message ?? null,
        }).toMatchSnapshot();
      });
    });

    when('[t1] invalid FQDN format', () => {
      const result = useBeforeAll(async () => {
        let ns: DeclaredSquarespaceDomainNameservers | null = null;
        let error: Error | null = null;
        try {
          ns = await setNameservers(
            {
              upsert: {
                domain: { name: TEST_DOMAIN },
                nameservers: ['not-a-valid-fqdn', 'also-invalid'], // invalid FQDNs
              },
            },
            context,
          );
        } catch (e) {
          error = e as Error;
        }
        return { ns, error };
      });

      then('throws validation error', () => {
        expect(result.error).not.toBeNull();
      });

      then('full result matches snapshot', () => {
        // snapshot full return value for exhaustive regression detection
        expect(result.ns).toMatchSnapshot();
      });

      then('error matches snapshot', () => {
        // snapshot error details for regression detection
        expect({
          errorName: result.error?.name ?? null,
          errorMessage: result.error?.message ?? null,
        }).toMatchSnapshot();
      });
    });

    when('[t2] more than 13 nameservers', () => {
      const result = useBeforeAll(async () => {
        let ns: DeclaredSquarespaceDomainNameservers | null = null;
        let error: Error | null = null;
        try {
          ns = await setNameservers(
            {
              upsert: {
                domain: { name: TEST_DOMAIN },
                nameservers: Array.from(
                  { length: 14 },
                  (_, i) => `ns${i + 1}.example.com`,
                ), // 14 nameservers (exceeds max 13)
              },
            },
            context,
          );
        } catch (e) {
          error = e as Error;
        }
        return { ns, error };
      });

      then('throws validation error', () => {
        expect(result.error).not.toBeNull();
      });

      then('full result matches snapshot', () => {
        // snapshot full return value for exhaustive regression detection
        expect(result.ns).toMatchSnapshot();
      });

      then('error matches snapshot', () => {
        // snapshot error details for regression detection
        expect({
          errorName: result.error?.name ?? null,
          errorMessage: result.error?.message ?? null,
        }).toMatchSnapshot();
      });
    });
  });
});
