import type { RefByUnique } from 'domain-objects';

import type { ContextSquarespaceAgent } from '../../domain.objects/ContextSquarespaceAgent';
import type { DeclaredSquarespaceDomainDnsRecord } from '../../domain.objects/DeclaredSquarespaceDomainDnsRecord';
import { delDnsRecord } from '../../domain.operations/domainDnsRecord/delDnsRecord';
import { getAllDnsRecords } from '../../domain.operations/domainDnsRecord/getAllDnsRecords';
import { getOneDnsRecord } from '../../domain.operations/domainDnsRecord/getOneDnsRecord';
import { setDnsRecord } from '../../domain.operations/domainDnsRecord/setDnsRecord';

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
      input: { domainName: string },
      context: ContextSquarespaceAgent,
    ): Promise<DeclaredSquarespaceDomainDnsRecord[]> =>
      getAllDnsRecords({ domainName: input.domainName }, context),
  },

  set: {
    /**
     * .what = finds existing DNS record or inserts new one
     * .why = enables idempotent DNS record creation
     */
    findsert: async (
      input: {
        entity: Pick<
          DeclaredSquarespaceDomainDnsRecord,
          'domain' | 'type' | 'host' | 'value'
        > &
          Partial<Pick<DeclaredSquarespaceDomainDnsRecord, 'ttl' | 'priority'>>;
      },
      context: ContextSquarespaceAgent,
    ): Promise<DeclaredSquarespaceDomainDnsRecord> =>
      setDnsRecord({ findsert: input.entity }, context),

    /**
     * .what = upserts a DNS record
     * .why = enables declarative DNS record management
     * .note = Squarespace requires delete+add for value changes; throws for existing records with different value
     */
    upsert: async (
      input: {
        entity: Pick<
          DeclaredSquarespaceDomainDnsRecord,
          'domain' | 'type' | 'host' | 'value'
        > &
          Partial<Pick<DeclaredSquarespaceDomainDnsRecord, 'ttl' | 'priority'>>;
      },
      context: ContextSquarespaceAgent,
    ): Promise<DeclaredSquarespaceDomainDnsRecord> =>
      setDnsRecord({ upsert: input.entity }, context),

    /**
     * .what = deletes a DNS record by unique key
     * .why = enables cleanup of DNS records before transfer
     */
    delete: async (
      input: {
        unique: RefByUnique<typeof DeclaredSquarespaceDomainDnsRecord>;
      },
      context: ContextSquarespaceAgent,
    ): Promise<{ deleted: boolean }> =>
      delDnsRecord({ by: { unique: input.unique } }, context),
  },
};
