import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceContext,
  requireSquarespaceCredentials,
} from '../../.test/getSampleSquarespaceContext';
import { DeclaredSquarespaceDomainNameservers } from '../../domain.objects/DeclaredSquarespaceDomainNameservers';
import { getNameservers } from './getNameservers';

/**
 * .what = integration tests for getNameservers domain operation
 * .why = validates nameserver lookup against live Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 */
describe('getNameservers', () => {
  requireSquarespaceCredentials();

  const TEST_DOMAIN = 'sunshineoceansurferturtles.com';

  // get context once before all tests
  const context = getSampleSquarespaceContext();

  given('a Squarespace account with domains', () => {
    when('getNameservers is called for extant domain', () => {
      const result = useBeforeAll(async () => {
        const nameservers = await getNameservers(
          { by: { unique: { domain: { name: TEST_DOMAIN } } } },
          context,
        );
        return { nameservers };
      });

      then('returns entity', () => {
        expect(result.nameservers).toBeDefined();
      });

      then('entity is a DeclaredSquarespaceDomainNameservers instance', () => {
        expect(result.nameservers).toBeInstanceOf(
          DeclaredSquarespaceDomainNameservers,
        );
      });

      then('entity has correct domain reference', () => {
        expect(result.nameservers?.domain.name).toBe(TEST_DOMAIN);
      });

      then('entity has nameservers property (null or array)', () => {
        const ns = result.nameservers?.nameservers;
        const isValidNameservers = ns === null || Array.isArray(ns);
        expect(isValidNameservers).toBe(true);
      });

      then('full entity matches snapshot', () => {
        // snapshot full return value for exhaustive regression detection
        expect(result.nameservers).toMatchSnapshot();
      });
    });

    when('getNameservers is called for non-extant domain', () => {
      const result = useBeforeAll(async () => {
        let nameservers = null;
        let error: Error | null = null;

        try {
          nameservers = await getNameservers(
            {
              by: {
                unique: { domain: { name: 'nonexistent-domain-xyz123.com' } },
              },
            },
            context,
          );
        } catch (e) {
          error = e as Error;
        }

        return { nameservers, error };
      });

      then('returns null or throws error for non-extant domain', () => {
        // operation either returns null or throws error for non-extant domain
        const isNullResult = result.nameservers === null;
        const isErrorResult = result.error !== null;
        expect(isNullResult || isErrorResult).toBe(true);
      });

      then('full result matches snapshot', () => {
        // snapshot full return value for exhaustive regression detection
        expect(result.nameservers).toMatchSnapshot();
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
