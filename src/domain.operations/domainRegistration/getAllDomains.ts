import { scrapeDomainDetail } from '../../access/sdks/playwright/domainDetail/scrapeDomainDetail';
import { scrapeDomainsList } from '../../access/sdks/playwright/domainsList/scrapeDomainsList';
import { withNewLoggedInBrowserPage } from '../../access/sdks/playwright/wrappers/withNewLoggedInBrowserPage';
import type { ContextSquarespaceAgentPage } from '../../domain.objects/ContextSquarespaceAgent';
import type { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';
import { withRemoteStateQueryCache } from '../../infra/performance/withRemoteStateCache';
import { castIntoDeclaredSquarespaceDomainRegistration } from './castIntoDeclaredSquarespaceDomainRegistration';

/**
 * .what = internal implementation of getAllDomains
 * .why = separates page logic from caching and wrapping concerns
 */
const getAllDomainsFromPage = async (
  _input: Record<string, never>,
  context: ContextSquarespaceAgentPage,
): Promise<DeclaredSquarespaceDomainRegistration[]> => {
  const { page } = context;

  // scrape list of all domains
  const domainsList = await scrapeDomainsList({ page });

  // fetch detail for each domain and cast to domain object
  const domains: DeclaredSquarespaceDomainRegistration[] = [];
  for (const listItem of domainsList) {
    // scrape detail for this domain
    const detail = await scrapeDomainDetail({
      page,
      domain: listItem.name,
    });

    // cast to domain object
    const domainRegistration = castIntoDeclaredSquarespaceDomainRegistration({
      raw: detail,
    });

    domains.push(domainRegistration);
  }

  return domains;
};

/**
 * .what = cache-wrapped getAllDomains operation
 * .why = enables cache invalidation via addTriggerToGetAllDomains
 */
const {
  execute: getAllDomainsWithCache,
  addTrigger: addTriggerToGetAllDomains,
} = withRemoteStateQueryCache(
  withNewLoggedInBrowserPage(getAllDomainsFromPage, {
    reusePageKey: 'domainsList',
  }),
  { name: 'getAllDomains' },
);

/**
 * .what = gets all domains from Squarespace account
 * .why = primary entry point for retrieving complete domain list
 */
export const getAllDomains = getAllDomainsWithCache;

/**
 * .what = registers a trigger to invalidate getAllDomains cache
 * .why = mutations that change domain data should invalidate this cache
 */
export { addTriggerToGetAllDomains };
