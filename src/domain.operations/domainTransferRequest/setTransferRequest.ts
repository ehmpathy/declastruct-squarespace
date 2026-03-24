import { RefByUnique } from 'domain-objects';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import { requestTransferCode } from '../../access/sdks/squarespace.via.playwright/domainDetail/requestTransferCode';
import { withNewLoggedInBrowserPage } from '../../access/sdks/squarespace.via.playwright/wrappers/withNewLoggedInBrowserPage';
import type {
  ContextSquarespaceAgent,
  ContextSquarespaceAgentPage,
} from '../../domain.objects/ContextSquarespaceAgent';
import type { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';
import { DeclaredSquarespaceDomainTransferRequest } from '../../domain.objects/DeclaredSquarespaceDomainTransferRequest';
import { withRemoteStateMutationRegistration } from '../../infra/performance/withRemoteStateCache';
import { getOneDomain } from '../domainRegistration/getOneDomain';
import {
  addTriggerToGetAllTransferRequests,
  getAllTransferRequests,
} from './getAllTransferRequests';

type SetTransferRequestInput = PickOne<{
  findsert: Pick<DeclaredSquarespaceDomainTransferRequest, 'domain'>;
  upsert: Pick<DeclaredSquarespaceDomainTransferRequest, 'domain'>;
}>;

/**
 * .what = core page-level implementation of setTransferRequest
 * .why = performs UI mutations only; lookups are done outside to avoid bottleneck deadlock
 */
const setTransferRequestCore = async (
  input: SetTransferRequestInput,
  context: ContextSquarespaceAgentPage,
  domainName: string,
): Promise<DeclaredSquarespaceDomainTransferRequest> => {
  const { page, agentOptions } = context;

  // request transfer code for the domain
  // .note = squarespace sends code via email, not displayed on page
  await requestTransferCode({
    page,
    domain: domainName,
    credentials: agentOptions.credentials,
  });

  // code sent via email (not returned from scraper)
  const status = 'CODE_SENT';

  // return new transfer request
  return new DeclaredSquarespaceDomainTransferRequest({
    domain: RefByUnique.as<typeof DeclaredSquarespaceDomainRegistration>({
      name: domainName,
    }),
    requestedAt: new Date().toISOString(),
    status,
  });
};

/**
 * .what = orchestrates setTransferRequest: validates and fetches data first, then mutates via page
 * .why = getOneDomain and getAllTransferRequests MUST be called OUTSIDE withNewLoggedInBrowserPage
 *        to avoid re-entrant bottleneck deadlock (both use maxConcurrent: 1)
 */
const setTransferRequestWithPage = async (
  input: SetTransferRequestInput,
  context: ContextSquarespaceAgent,
): Promise<DeclaredSquarespaceDomainTransferRequest> => {
  const requestDesired = input.findsert ?? input.upsert;

  // validate domain reference provided
  if (!requestDesired?.domain?.name)
    UnexpectedCodePathError.throw('no domain name in input', { input });

  const domainName = requestDesired.domain.name;

  // verify domain is unlocked OUTSIDE page wrapper to avoid bottleneck deadlock
  // .note = criteria: locked domain must return error, not attempt transfer
  const domainFound = await getOneDomain(
    { by: { unique: { name: domainName } } },
    context,
  );
  if (!domainFound)
    throw new BadRequestError('domain not found', { domain: domainName });
  if (domainFound.isLocked) {
    throw new BadRequestError('domain must be unlocked before transfer', {
      domain: domainName,
      lockReason: domainFound.lockReason,
    });
  }

  // check for awaited verification (per blackbox criteria usecase.5)
  if (domainFound.status === 'PENDING') {
    throw new BadRequestError('domain has awaited verification', {
      domain: domainName,
      status: domainFound.status,
      hint: 'complete domain verification before transfer request',
    });
  }

  // fetch current transfer requests OUTSIDE page wrapper to avoid bottleneck deadlock
  const transfersAll = await getAllTransferRequests({}, context);
  const transferFound = transfersAll.find(
    (t: DeclaredSquarespaceDomainTransferRequest) =>
      t.domain.name === domainName,
  );

  // for findsert, return if transfer request already extant AND not expired
  // .note = transfer codes expire after 14 days per squarespace policy
  if (input.findsert && transferFound) {
    const requestedAt = new Date(transferFound.requestedAt);
    const daysSinceRequest = Math.floor(
      (Date.now() - requestedAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    const isExpired = daysSinceRequest > 14;

    // if not expired, return the found transfer request (idempotent)
    if (!isExpired) {
      return transferFound;
    }
    // if expired, fall through to request new code
  }

  // for upsert with extant request in completed/cancelled state, allow re-request
  if (
    input.upsert &&
    transferFound &&
    transferFound.status !== 'COMPLETED' &&
    transferFound.status !== 'CANCELLED'
  ) {
    return transferFound;
  }

  // now get page and perform mutation (sequential bottleneck use, not nested)
  const wrappedCore = withNewLoggedInBrowserPage(
    (
      coreInput: SetTransferRequestInput,
      pageContext: ContextSquarespaceAgentPage,
    ) => setTransferRequestCore(coreInput, pageContext, domainName),
    { reusePageKey: 'domainDetail' },
  );

  return wrappedCore(input, context);
};

/**
 * .what = mutation-registered setTransferRequest operation
 * .why = enables cache invalidation of getAllTransferRequests on mutation
 */
const setTransferRequestMutation = withRemoteStateMutationRegistration(
  setTransferRequestWithPage,
  { name: { override: 'setTransferRequest' } },
);

// register cache invalidation trigger
addTriggerToGetAllTransferRequests({
  invalidatedBy: {
    mutation: setTransferRequestMutation,
    affects: ({ cachedQueryKeys }: { cachedQueryKeys: string[] }) => ({
      keys: cachedQueryKeys,
    }),
  },
});

/**
 * .what = requests a transfer code for a domain
 * .why = enables domain transfer-out initiation for migration to new registrar
 * .note = transfer code is typically sent via email, not returned directly
 */
export const setTransferRequest = setTransferRequestMutation.execute;
