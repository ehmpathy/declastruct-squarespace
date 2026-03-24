import { scrapeTransferRequests } from '../../access/sdks/squarespace.via.playwright/transfersList/scrapeTransferRequests';
import { withNewLoggedInBrowserPage } from '../../access/sdks/squarespace.via.playwright/wrappers/withNewLoggedInBrowserPage';
import type { ContextSquarespaceAgentPage } from '../../domain.objects/ContextSquarespaceAgent';
import type { DeclaredSquarespaceDomainTransferRequest } from '../../domain.objects/DeclaredSquarespaceDomainTransferRequest';
import { withRemoteStateQueryCache } from '../../infra/performance/withRemoteStateCache';
import { castIntoDeclaredSquarespaceDomainTransferRequest } from './castIntoDeclaredSquarespaceDomainTransferRequest';

/**
 * .what = internal implementation of getAllTransferRequests with page access
 * .why = separates page logic from caching and wrapping concerns
 */
const getAllTransferRequestsFromPage = async (
  _input: Record<string, never>,
  context: ContextSquarespaceAgentPage,
): Promise<DeclaredSquarespaceDomainTransferRequest[]> => {
  const { page } = context;

  // scrape all transfer requests from page
  const rawTransfers = await scrapeTransferRequests({ page });

  // filter to only outbound transfers (transfers out of squarespace)
  const outboundTransfers = rawTransfers.filter(
    (t) =>
      t.direction === null ||
      t.direction.toLowerCase().includes('out') ||
      t.direction.toLowerCase().includes('away'),
  );

  // cast to domain objects
  return outboundTransfers.map((raw) =>
    castIntoDeclaredSquarespaceDomainTransferRequest({ raw }),
  );
};

/**
 * .what = cache-wrapped getAllTransferRequests query
 * .why = reduces browser automation overhead via caching
 */
const {
  execute: getAllTransferRequestsWithCache,
  addTrigger: addTriggerToGetAllTransferRequests,
} = withRemoteStateQueryCache(
  withNewLoggedInBrowserPage(getAllTransferRequestsFromPage, {
    reusePageKey: 'transfersList',
  }),
  { name: 'getAllTransferRequests' },
);

/**
 * .what = retrieves all domain transfer requests from Squarespace
 * .why = enables monitoring transfer status for batch domain migrations
 */
export const getAllTransferRequests = getAllTransferRequestsWithCache;
export { addTriggerToGetAllTransferRequests };
