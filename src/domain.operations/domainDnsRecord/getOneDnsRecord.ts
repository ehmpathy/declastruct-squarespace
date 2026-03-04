import type { RefByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';

import type { ContextSquarespaceAgent } from '../../domain.objects/ContextSquarespaceAgent';
import type { DeclaredSquarespaceDomainDnsRecord } from '../../domain.objects/DeclaredSquarespaceDomainDnsRecord';
import { getAllDnsRecords } from './getAllDnsRecords';

/**
 * .what = gets a single DNS record by unique key
 * .why = enables lookup of specific DNS record without full list handling
 * .note = delegates to getAllDnsRecords and filters in-memory (no separate cache)
 */
export const getOneDnsRecord = async (
  input: {
    by: {
      unique: RefByUnique<typeof DeclaredSquarespaceDomainDnsRecord>;
    };
  },
  context: ContextSquarespaceAgent,
): Promise<DeclaredSquarespaceDomainDnsRecord | null> => {
  // validate input
  if (!input.by.unique.domain?.name)
    UnexpectedCodePathError.throw('no domain name provided', { input });

  const domainName = input.by.unique.domain.name;

  // fetch all DNS records for this domain (cached)
  const dnsRecords = await getAllDnsRecords({ domainName }, context);

  // filter to find the requested record
  const recordFound = dnsRecords.find(
    (record) =>
      record.domain.name === domainName &&
      record.type === input.by.unique.type &&
      record.host === input.by.unique.host,
  );

  // return record or null if not found
  return recordFound ?? null;
};
