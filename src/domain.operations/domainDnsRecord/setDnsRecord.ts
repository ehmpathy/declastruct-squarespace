import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import { addDnsRecord } from '../../access/sdks/playwright/dnsSettings/addDnsRecord';
import { scrapeDnsRecords } from '../../access/sdks/playwright/dnsSettings/scrapeDnsRecords';
import { withNewLoggedInBrowserPage } from '../../access/sdks/playwright/wrappers/withNewLoggedInBrowserPage';
import type { ContextSquarespaceAgentPage } from '../../domain.objects/ContextSquarespaceAgent';
import type { DeclaredSquarespaceDomainDnsRecord } from '../../domain.objects/DeclaredSquarespaceDomainDnsRecord';
import { withRemoteStateMutationRegistration } from '../../infra/performance/withRemoteStateCache';
import { castIntoDeclaredSquarespaceDomainDnsRecord } from './castIntoDeclaredSquarespaceDomainDnsRecord';
import {
  addTriggerToGetAllDnsRecords,
  getAllDnsRecords,
} from './getAllDnsRecords';

/**
 * .what = internal implementation of setDnsRecord with page access
 * .why = separates page logic from caching and wrapping concerns
 */
const setDnsRecordWithPage = async (
  input: PickOne<{
    findsert: Pick<
      DeclaredSquarespaceDomainDnsRecord,
      'domain' | 'type' | 'host' | 'value'
    > &
      Partial<Pick<DeclaredSquarespaceDomainDnsRecord, 'ttl' | 'priority'>>;
    upsert: Pick<
      DeclaredSquarespaceDomainDnsRecord,
      'domain' | 'type' | 'host' | 'value'
    > &
      Partial<Pick<DeclaredSquarespaceDomainDnsRecord, 'ttl' | 'priority'>>;
  }>,
  context: ContextSquarespaceAgentPage,
): Promise<DeclaredSquarespaceDomainDnsRecord> => {
  const { page, agentOptions } = context;
  const recordDesired = input.findsert ?? input.upsert;

  // validate domain name provided
  if (!recordDesired?.domain?.name)
    UnexpectedCodePathError.throw('no domain name in input', { input });

  const domainName = recordDesired.domain.name;

  // fetch current DNS records from cache
  const recordsAll = await getAllDnsRecords({ domainName }, context);
  const recordFound = recordsAll.find(
    (r) =>
      r.domain.name === domainName &&
      r.type === recordDesired.type &&
      r.host === recordDesired.host,
  );

  // for findsert, return if record exists
  if (input.findsert && recordFound) {
    return recordFound;
  }

  // for upsert, if record exists with same value, return it
  if (
    input.upsert &&
    recordFound &&
    recordFound.value === recordDesired.value
  ) {
    return recordFound;
  }

  // cannot update existing records in Squarespace via UI, throw error for upsert
  if (input.upsert && recordFound) {
    throw new BadRequestError(
      'cannot upsert existing DNS record with different value; Squarespace requires delete+add',
      { recordFound, recordDesired },
    );
  }

  // add the new DNS record
  const addResult = await addDnsRecord({
    page,
    domain: domainName,
    record: {
      type: recordDesired.type as
        | 'A'
        | 'AAAA'
        | 'CNAME'
        | 'MX'
        | 'TXT'
        | 'NS'
        | 'SRV',
      host: recordDesired.host,
      value: recordDesired.value,
      ttl: recordDesired.ttl?.toString(),
      priority: recordDesired.priority?.toString(),
    },
    credentials: agentOptions.credentials,
  });

  if (!addResult.success) {
    throw new BadRequestError('failed to add DNS record', {
      domain: domainName,
      record: recordDesired,
      error: addResult.error,
    });
  }

  // scrape fresh to return accurate state
  const recordsAfter = await scrapeDnsRecords({ page, domain: domainName });
  const rawCreated = recordsAfter.find(
    (r) =>
      r.type.toUpperCase() === recordDesired.type &&
      r.host === recordDesired.host &&
      r.value === recordDesired.value,
  );

  if (!rawCreated) {
    throw new UnexpectedCodePathError('created record not found after add', {
      domain: domainName,
      recordDesired,
      recordsAfter,
    });
  }

  return castIntoDeclaredSquarespaceDomainDnsRecord({
    raw: rawCreated,
    domainName,
  });
};

/**
 * .what = mutation-registered setDnsRecord operation
 * .why = enables cache invalidation of getAllDnsRecords on mutation
 */
const setDnsRecordMutation = withRemoteStateMutationRegistration(
  withNewLoggedInBrowserPage(setDnsRecordWithPage, {
    reusePageKey: 'dnsSettings',
  }),
  { name: 'setDnsRecord' },
);

// register cache invalidation trigger
addTriggerToGetAllDnsRecords({
  invalidatedBy: {
    mutation: setDnsRecordMutation,
    affects: ({ cachedQueryKeys }) => ({ keys: cachedQueryKeys }),
  },
});

/**
 * .what = sets a DNS record on a domain
 * .why = enables declarative DNS record management for domain transfers
 */
export const setDnsRecord = setDnsRecordMutation.execute;
