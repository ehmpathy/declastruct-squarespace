import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import { requestTransferCode } from '../../access/sdks/playwright/domainDetail/requestTransferCode';
import { withNewLoggedInBrowserPage } from '../../access/sdks/playwright/wrappers/withNewLoggedInBrowserPage';
import type { ContextSquarespaceAgentPage } from '../../domain.objects/ContextSquarespaceAgent';
import { DeclaredSquarespaceDomainTransferRequest } from '../../domain.objects/DeclaredSquarespaceDomainTransferRequest';
import { withRemoteStateMutationRegistration } from '../../infra/performance/withRemoteStateCache';
import {
  addTriggerToGetAllTransferRequests,
  getAllTransferRequests,
} from './getAllTransferRequests';

/**
 * .what = internal implementation of setTransferRequest with page access
 * .why = separates page logic from caching and wrapping concerns
 */
const setTransferRequestWithPage = async (
  input: PickOne<{
    findsert: Pick<DeclaredSquarespaceDomainTransferRequest, 'domain'>;
    upsert: Pick<DeclaredSquarespaceDomainTransferRequest, 'domain'>;
  }>,
  context: ContextSquarespaceAgentPage,
): Promise<DeclaredSquarespaceDomainTransferRequest> => {
  const { page, agentOptions } = context;
  const requestDesired = input.findsert ?? input.upsert;

  // validate domain reference provided
  if (!requestDesired?.domain?.name)
    UnexpectedCodePathError.throw('no domain name in input', { input });

  const domainName = requestDesired.domain.name;

  // fetch current transfer requests from cache
  const transfersAll = await getAllTransferRequests({}, context);
  const transferFound = transfersAll.find((t) => t.domain.name === domainName);

  // for findsert, return if transfer request already exists
  if (input.findsert && transferFound) {
    return transferFound;
  }

  // for upsert with existing request in completed/cancelled state, allow re-request
  if (
    input.upsert &&
    transferFound &&
    transferFound.status !== 'COMPLETED' &&
    transferFound.status !== 'CANCELLED'
  ) {
    return transferFound;
  }

  // request transfer code for the domain
  const result = await requestTransferCode({
    page,
    domain: domainName,
    credentials: agentOptions.credentials,
  });

  if (!result.success) {
    throw new BadRequestError('failed to request transfer code', {
      domain: domainName,
      result,
    });
  }

  // determine status based on result
  const status = result.emailSent ? 'CODE_SENT' : 'REQUESTED';

  // return new transfer request
  return new DeclaredSquarespaceDomainTransferRequest({
    domain: { name: domainName },
    requestedAt: new Date().toISOString(),
    status,
  });
};

/**
 * .what = mutation-registered setTransferRequest operation
 * .why = enables cache invalidation of getAllTransferRequests on mutation
 */
const setTransferRequestMutation = withRemoteStateMutationRegistration(
  withNewLoggedInBrowserPage(setTransferRequestWithPage, {
    reusePageKey: 'domainDetail',
  }),
  { name: 'setTransferRequest' },
);

// register cache invalidation trigger
addTriggerToGetAllTransferRequests({
  invalidatedBy: {
    mutation: setTransferRequestMutation,
    affects: ({ cachedQueryKeys }) => ({ keys: cachedQueryKeys }),
  },
});

/**
 * .what = requests a transfer code for a domain
 * .why = enables domain transfer-out initiation for migration to new registrar
 * .note = transfer code is typically sent via email, not returned directly
 */
export const setTransferRequest = setTransferRequestMutation.execute;
