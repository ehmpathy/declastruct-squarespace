import type { RefByUnique } from 'domain-objects';

import type { ContextSquarespaceAgent } from '../../domain.objects/ContextSquarespaceAgent';
import type { DeclaredSquarespaceDomainTransferRequest } from '../../domain.objects/DeclaredSquarespaceDomainTransferRequest';
import { getAllTransferRequests } from '../../domain.operations/domainTransferRequest/getAllTransferRequests';
import { getOneTransferRequest } from '../../domain.operations/domainTransferRequest/getOneTransferRequest';
import { setTransferRequest } from '../../domain.operations/domainTransferRequest/setTransferRequest';

/**
 * .what = DAO for DeclaredSquarespaceDomainTransferRequest
 * .why = provides a unified interface for domain transfer request operations
 */
export const DeclaredSquarespaceDomainTransferRequestDao = {
  get: {
    /**
     * .what = gets a single transfer request by domain reference
     * .why = enables lookup of transfer status for a specific domain
     */
    one: {
      byUnique: async (
        input: {
          unique: RefByUnique<typeof DeclaredSquarespaceDomainTransferRequest>;
        },
        context: ContextSquarespaceAgent,
      ): Promise<DeclaredSquarespaceDomainTransferRequest | null> =>
        getOneTransferRequest({ by: { unique: input.unique } }, context),
    },

    /**
     * .what = gets all transfer requests from the Squarespace account
     * .why = enables monitoring of batch domain transfers
     */
    all: async (
      _input: Record<string, never>,
      context: ContextSquarespaceAgent,
    ): Promise<DeclaredSquarespaceDomainTransferRequest[]> =>
      getAllTransferRequests({}, context),
  },

  set: {
    /**
     * .what = requests a transfer code for a domain (find-or-insert)
     * .why = enables idempotent transfer initiation
     * .note = transfer code is sent via email, not returned directly
     */
    findsert: async (
      input: {
        entity: Pick<DeclaredSquarespaceDomainTransferRequest, 'domain'>;
      },
      context: ContextSquarespaceAgent,
    ): Promise<DeclaredSquarespaceDomainTransferRequest> =>
      setTransferRequest({ findsert: input.entity }, context),

    /**
     * .what = upsert not supported for transfer requests
     * .why = transfer requests are immutable once created; use findsert
     */
    upsert: null,

    /**
     * .what = delete not supported for transfer requests
     * .why = transfer requests cannot be cancelled via this interface
     */
    delete: null,
  },
};
