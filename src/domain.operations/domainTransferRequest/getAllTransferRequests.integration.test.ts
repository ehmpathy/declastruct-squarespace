import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceContext,
  requireSquarespaceCredentials,
} from '../../.test/getSampleSquarespaceContext';
import { DeclaredSquarespaceDomainTransferRequest } from '../../domain.objects/DeclaredSquarespaceDomainTransferRequest';
import { getAllTransferRequests } from './getAllTransferRequests';

/**
 * .what = integration tests for getAllTransferRequests domain operation
 * .why = validates transfer request retrieval against live Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 * .note = may return empty array if no transfer requests exist in account
 */
describe('getAllTransferRequests', () => {
  requireSquarespaceCredentials();

  // get context once before all tests
  const context = getSampleSquarespaceContext();

  given('a Squarespace account', () => {
    when('getAllTransferRequests is called', () => {
      const result = useBeforeAll(async () => {
        const transferRequests = await getAllTransferRequests({}, context);
        return { transferRequests };
      });

      then('returns an array', () => {
        expect(Array.isArray(result.transferRequests)).toBe(true);
      });

      then(
        'each transfer request is a DeclaredSquarespaceDomainTransferRequest instance',
        () => {
          for (const request of result.transferRequests) {
            expect(request).toBeInstanceOf(
              DeclaredSquarespaceDomainTransferRequest,
            );
          }
        },
      );

      then('each transfer request has required properties', () => {
        for (const request of result.transferRequests) {
          expect(request.domain).toBeDefined();
          expect(request.domain.name).toBeDefined();
          expect(typeof request.domain.name).toBe('string');
          expect(request.status).toBeDefined();
          expect(request.requestedAt).toBeDefined();
        }
      });
    });

    when('getAllTransferRequests is called again (cached)', () => {
      // capture first call results for comparison
      const firstCallResult = useBeforeAll(async () => {
        const transferRequests = await getAllTransferRequests({}, context);
        return { transferRequests };
      });

      const result = useBeforeAll(async () => {
        const startTime = Date.now();
        const transferRequests = await getAllTransferRequests({}, context);
        const duration = Date.now() - startTime;
        return { transferRequests, duration };
      });

      then('returns same data as first call', () => {
        expect(result.transferRequests.length).toBe(
          firstCallResult.transferRequests.length,
        );
        // verify each request matches by domain name
        for (let i = 0; i < result.transferRequests.length; i++) {
          expect(result.transferRequests[i]?.domain.name).toBe(
            firstCallResult.transferRequests[i]?.domain.name,
          );
        }
      });

      then('cache hit is faster than initial call', () => {
        // cache hit should be nearly instant (under 1 second)
        expect(result.duration).toBeLessThan(1000);
      });
    });
  });
});
