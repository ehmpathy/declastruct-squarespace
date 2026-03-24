import { RefByUnique } from 'domain-objects';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceContext,
  requireSquarespaceCredentials,
} from '../../.test/getSampleSquarespaceContext';
import type { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';
import { DeclaredSquarespaceDomainTransferRequest } from '../../domain.objects/DeclaredSquarespaceDomainTransferRequest';
import { getAllTransferRequests } from './getAllTransferRequests';
import { getOneTransferRequest } from './getOneTransferRequest';

/**
 * .what = integration tests for getOneTransferRequest domain operation
 * .why = validates single transfer request lookup against live Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 */
describe('getOneTransferRequest', () => {
  requireSquarespaceCredentials();

  // get context once before all tests
  const context = getSampleSquarespaceContext();

  given('a Squarespace account', () => {
    when('getOneTransferRequest is called for extant transfer', () => {
      const result = useBeforeAll(async () => {
        // first, get all transfer requests to find one to test with
        const transferRequestsAll = await getAllTransferRequests({}, context);

        // skip if no transfer requests exist
        if (transferRequestsAll.length === 0) {
          return { skipped: true, transferRequest: null, domainName: null };
        }

        // get the first transfer request's domain name
        const domainName = transferRequestsAll[0].domain.name;

        const transferRequest = await getOneTransferRequest(
          {
            by: {
              unique: {
                domain: RefByUnique.as<
                  typeof DeclaredSquarespaceDomainRegistration
                >({ name: domainName }),
              },
            },
          },
          context,
        );

        return { skipped: false, transferRequest, domainName };
      });

      then('returns the transfer request or is skipped', () => {
        if (result.skipped) {
          // no transfer requests in account - test is inconclusive
          expect(result.transferRequest).toBeNull();
        } else {
          expect(result.transferRequest).toBeDefined();
        }
      });

      then(
        'transfer request is a DeclaredSquarespaceDomainTransferRequest',
        () => {
          if (result.skipped) return;
          expect(result.transferRequest).toBeInstanceOf(
            DeclaredSquarespaceDomainTransferRequest,
          );
        },
      );

      then('transfer request has correct domain', () => {
        if (result.skipped) return;
        expect(result.transferRequest?.domain.name).toBe(result.domainName);
      });
    });

    when('getOneTransferRequest is called with absent domain', () => {
      const result = useBeforeAll(async () => {
        const transferRequest = await getOneTransferRequest(
          {
            by: {
              unique: {
                domain: RefByUnique.as<
                  typeof DeclaredSquarespaceDomainRegistration
                >({ name: 'absent-domain-xyz123-notreal.com' }),
              },
            },
          },
          context,
        );
        return { transferRequest };
      });

      then('returns null', () => {
        expect(result.transferRequest).toBeNull();
      });
    });
  });
});
