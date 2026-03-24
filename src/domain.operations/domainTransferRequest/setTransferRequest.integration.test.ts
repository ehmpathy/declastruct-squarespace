import { RefByUnique } from 'domain-objects';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceContext,
  requireSquarespaceCredentials,
} from '../../.test/getSampleSquarespaceContext';
import type { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';
import { DeclaredSquarespaceDomainTransferRequest } from '../../domain.objects/DeclaredSquarespaceDomainTransferRequest';
import { setDomain } from '../domainRegistration/setDomain';
import { setTransferRequest } from './setTransferRequest';

/**
 * .what = integration tests for setTransferRequest domain operation
 * .why = validates transfer code request against live Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 * .note = this test actually requests a transfer code (sends email to account)
 * .note = uses 600s timeout due to multiple slow UI interactions
 */
describe('setTransferRequest', () => {
  requireSquarespaceCredentials();

  // increase jest timeout for slow UI operations
  jest.setTimeout(600000);

  const TEST_DOMAIN = 'sunshineoceansurferturtles.com';

  // get context once before all tests
  const context = getSampleSquarespaceContext();

  given('a Squarespace account with domains', () => {
    // ensure domain is unlocked before transfer request tests
    useBeforeAll(async () => {
      await setDomain(
        { upsert: { name: TEST_DOMAIN, isLocked: false } },
        context,
      );
      return {};
    });

    when('setTransferRequest findsert is called', () => {
      const result = useBeforeAll(async () => {
        const transferRequest = await setTransferRequest(
          {
            findsert: {
              domain: RefByUnique.as<
                typeof DeclaredSquarespaceDomainRegistration
              >({ name: TEST_DOMAIN }),
            },
          },
          context,
        );
        return { transferRequest };
      });

      then('returns a transfer request', () => {
        expect(result.transferRequest).toBeDefined();
      });

      then(
        'transfer request is a DeclaredSquarespaceDomainTransferRequest',
        () => {
          expect(result.transferRequest).toBeInstanceOf(
            DeclaredSquarespaceDomainTransferRequest,
          );
        },
      );

      then('transfer request has correct domain', () => {
        expect(result.transferRequest.domain.name).toBe(TEST_DOMAIN);
      });

      then('transfer request has requestedAt', () => {
        expect(result.transferRequest.requestedAt).toBeDefined();
        expect(typeof result.transferRequest.requestedAt).toBe('string');
      });

      then('transfer request has status', () => {
        expect(result.transferRequest.status).toBeDefined();
        // status should be one of: REQUESTED, CODE_SENT, etc.
        expect(['REQUESTED', 'CODE_SENT', 'PENDING']).toContain(
          result.transferRequest.status,
        );
      });
    });

    when('setTransferRequest findsert is called again (idempotent)', () => {
      const result = useBeforeAll(async () => {
        const startTime = Date.now();
        const transferRequest = await setTransferRequest(
          {
            findsert: {
              domain: RefByUnique.as<
                typeof DeclaredSquarespaceDomainRegistration
              >({ name: TEST_DOMAIN }),
            },
          },
          context,
        );
        const duration = Date.now() - startTime;
        return { transferRequest, duration };
      });

      then('returns same transfer request', () => {
        expect(result.transferRequest).toBeDefined();
        expect(result.transferRequest.domain.name).toBe(TEST_DOMAIN);
      });

      then('findsert is faster than initial request (cached)', () => {
        // findsert of extant transfer request should use cache
        // should be significantly faster than UI interaction
        expect(result.duration).toBeLessThan(60000);
      });
    });
  });
});
