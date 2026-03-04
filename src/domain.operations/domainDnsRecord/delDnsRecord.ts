import type { RefByUnique } from 'domain-objects';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';

import { deleteDnsRecord } from '../../access/sdks/playwright/dnsSettings/deleteDnsRecord';
import { withNewLoggedInBrowserPage } from '../../access/sdks/playwright/wrappers/withNewLoggedInBrowserPage';
import type { ContextSquarespaceAgentPage } from '../../domain.objects/ContextSquarespaceAgent';
import type { DeclaredSquarespaceDomainDnsRecord } from '../../domain.objects/DeclaredSquarespaceDomainDnsRecord';
import { withRemoteStateMutationRegistration } from '../../infra/performance/withRemoteStateCache';
import {
  addTriggerToGetAllDnsRecords,
  getAllDnsRecords,
} from './getAllDnsRecords';

/**
 * .what = internal implementation of delDnsRecord with page access
 * .why = separates page logic from caching and wrapping concerns
 */
const delDnsRecordWithPage = async (
  input: {
    by: {
      unique: RefByUnique<typeof DeclaredSquarespaceDomainDnsRecord>;
    };
  },
  context: ContextSquarespaceAgentPage,
): Promise<{ deleted: boolean }> => {
  const { page, agentOptions } = context;

  // validate domain name provided
  if (!input.by.unique.domain?.name)
    UnexpectedCodePathError.throw('no domain name in input', { input });

  const domainName = input.by.unique.domain.name;
  const recordType = input.by.unique.type;
  const recordHost = input.by.unique.host;

  // fetch current DNS records from cache
  const recordsAll = await getAllDnsRecords({ domainName }, context);
  const recordFound = recordsAll.find(
    (r) =>
      r.domain.name === domainName &&
      r.type === recordType &&
      r.host === recordHost,
  );

  // if record doesn't exist, return early (idempotent)
  if (!recordFound) {
    return { deleted: false };
  }

  // check if this is a preset record
  if (recordFound.isPreset) {
    throw new BadRequestError('cannot delete preset DNS records', {
      record: recordFound,
    });
  }

  // delete the DNS record
  const deleteResult = await deleteDnsRecord({
    page,
    domain: domainName,
    recordMatch: {
      type: recordType,
      host: recordHost,
      value: recordFound.value,
    },
    credentials: agentOptions.credentials,
  });

  if (!deleteResult.success) {
    throw new BadRequestError('failed to delete DNS record', {
      domain: domainName,
      record: recordFound,
      error: deleteResult.error,
    });
  }

  return { deleted: true };
};

/**
 * .what = mutation-registered delDnsRecord operation
 * .why = enables cache invalidation of getAllDnsRecords on mutation
 */
const delDnsRecordMutation = withRemoteStateMutationRegistration(
  withNewLoggedInBrowserPage(delDnsRecordWithPage, {
    reusePageKey: 'dnsSettings',
  }),
  { name: 'delDnsRecord' },
);

// register cache invalidation trigger
addTriggerToGetAllDnsRecords({
  invalidatedBy: {
    mutation: delDnsRecordMutation,
    affects: ({ cachedQueryKeys }) => ({ keys: cachedQueryKeys }),
  },
});

/**
 * .what = deletes a DNS record from a domain
 * .why = enables declarative DNS record management for domain transfers
 */
export const delDnsRecord = delDnsRecordMutation.execute;
