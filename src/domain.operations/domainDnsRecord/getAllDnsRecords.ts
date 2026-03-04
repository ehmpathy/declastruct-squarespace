import { scrapeDnsRecords } from '../../access/sdks/playwright/dnsSettings/scrapeDnsRecords';
import { withNewLoggedInBrowserPage } from '../../access/sdks/playwright/wrappers/withNewLoggedInBrowserPage';
import type { ContextSquarespaceAgentPage } from '../../domain.objects/ContextSquarespaceAgent';
import type { DeclaredSquarespaceDomainDnsRecord } from '../../domain.objects/DeclaredSquarespaceDomainDnsRecord';
import { withRemoteStateQueryCache } from '../../infra/performance/withRemoteStateCache';
import { castIntoDeclaredSquarespaceDomainDnsRecord } from './castIntoDeclaredSquarespaceDomainDnsRecord';

/**
 * .what = internal implementation of getAllDnsRecords
 * .why = separates page logic from caching and wrapping concerns
 */
const getAllDnsRecordsFromPage = async (
  input: { domainName: string },
  context: ContextSquarespaceAgentPage,
): Promise<DeclaredSquarespaceDomainDnsRecord[]> => {
  const { page } = context;
  const { domainName } = input;

  // scrape raw dns records
  const rawRecords = await scrapeDnsRecords({
    page,
    domain: domainName,
  });

  // cast each record to domain object
  const dnsRecords: DeclaredSquarespaceDomainDnsRecord[] = rawRecords.map(
    (raw) =>
      castIntoDeclaredSquarespaceDomainDnsRecord({
        raw,
        domainName,
      }),
  );

  return dnsRecords;
};

/**
 * .what = cache-wrapped getAllDnsRecords operation
 * .why = enables cache invalidation via addTriggerToGetAllDnsRecords
 */
const {
  execute: getAllDnsRecordsWithCache,
  addTrigger: addTriggerToGetAllDnsRecords,
} = withRemoteStateQueryCache(
  withNewLoggedInBrowserPage(getAllDnsRecordsFromPage, {
    reusePageKey: 'dnsSettings',
  }),
  { name: 'getAllDnsRecords' },
);

/**
 * .what = gets all DNS records for a domain from Squarespace account
 * .why = primary entry point for retrieving complete DNS record list
 */
export const getAllDnsRecords = getAllDnsRecordsWithCache;

/**
 * .what = registers a trigger to invalidate getAllDnsRecords cache
 * .why = mutations that change DNS data should invalidate this cache
 */
export { addTriggerToGetAllDnsRecords };
