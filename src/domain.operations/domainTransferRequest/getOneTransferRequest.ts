import type { RefByUnique } from 'domain-objects';

import type { ContextSquarespaceAgent } from '../../domain.objects/ContextSquarespaceAgent';
import type { DeclaredSquarespaceDomainTransferRequest } from '../../domain.objects/DeclaredSquarespaceDomainTransferRequest';
import { getAllTransferRequests } from './getAllTransferRequests';

/**
 * .what = retrieves a single transfer request by domain reference
 * .why = enables lookup of transfer status for a specific domain
 */
export const getOneTransferRequest = async (
  input: {
    by: {
      unique: RefByUnique<typeof DeclaredSquarespaceDomainTransferRequest>;
    };
  },
  context: ContextSquarespaceAgent,
): Promise<DeclaredSquarespaceDomainTransferRequest | null> => {
  // fetch all transfer requests from cache
  const allTransfers = await getAllTransferRequests({}, context);

  // find the one that matches the domain reference
  const transferFound = allTransfers.find(
    (t: DeclaredSquarespaceDomainTransferRequest) =>
      t.domain.name === input.by.unique.domain?.name,
  );

  return transferFound ?? null;
};
