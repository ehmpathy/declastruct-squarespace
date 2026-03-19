import type { RefByUnique } from 'domain-objects';

import type { ContextSquarespaceAgent } from '../../domain.objects/ContextSquarespaceAgent';
import type { DeclaredSquarespaceDomainDnsRecord } from '../../domain.objects/DeclaredSquarespaceDomainDnsRecord';
import type { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';
import { getAllDnsRecords } from '../../domain.operations/domainDnsRecord/getAllDnsRecords';
import { getOneDnsRecord } from '../../domain.operations/domainDnsRecord/getOneDnsRecord';

/**
 * .what = DAO for DeclaredSquarespaceDomainDnsRecord
 * .why = provides a unified interface for DNS record operations
 */
export const DeclaredSquarespaceDomainDnsRecordDao = {
  get: {
    /**
     * .what = gets a single DNS record by unique key
     * .why = enables lookup of specific DNS record by domain+type+host
     */
    one: {
      byUnique: async (
        input: {
          unique: RefByUnique<typeof DeclaredSquarespaceDomainDnsRecord>;
        },
        context: ContextSquarespaceAgent,
      ): Promise<DeclaredSquarespaceDomainDnsRecord | null> =>
        getOneDnsRecord({ by: { unique: input.unique } }, context),
    },

    /**
     * .what = gets all DNS records for a domain
     * .why = enables batch operations on DNS configuration
     */
    all: async (
      input: {
        domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>;
      },
      context: ContextSquarespaceAgent,
    ): Promise<DeclaredSquarespaceDomainDnsRecord[]> =>
      getAllDnsRecords({ domain: input.domain }, context),
  },
};
