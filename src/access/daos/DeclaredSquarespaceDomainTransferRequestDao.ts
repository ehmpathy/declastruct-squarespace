import { genDeclastructDao } from 'declastruct';

import type { ContextSquarespaceAgent } from '../../domain.objects/ContextSquarespaceAgent';
import { DeclaredSquarespaceDomainTransferRequest } from '../../domain.objects/DeclaredSquarespaceDomainTransferRequest';
import { getOneTransferRequest } from '../../domain.operations/domainTransferRequest/getOneTransferRequest';
import { setTransferRequest } from '../../domain.operations/domainTransferRequest/setTransferRequest';

/**
 * .what = DAO for DeclaredSquarespaceDomainTransferRequest
 * .why = provides a unified interface for domain transfer request operations
 */
export const DeclaredSquarespaceDomainTransferRequestDao = genDeclastructDao<
  typeof DeclaredSquarespaceDomainTransferRequest,
  ContextSquarespaceAgent
>({
  dobj: DeclaredSquarespaceDomainTransferRequest,
  get: {
    one: {
      byUnique: async (input, context) =>
        getOneTransferRequest({ by: { unique: input } }, context),
      byPrimary: null,
    },
  },
  set: {
    /**
     * .what = requests a transfer code for a domain (find-or-insert)
     * .why = enables idempotent transfer initiation
     * .note = transfer code is sent via email, not returned directly
     */
    findsert: async (input, context) =>
      setTransferRequest({ findsert: input }, context),
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
});
