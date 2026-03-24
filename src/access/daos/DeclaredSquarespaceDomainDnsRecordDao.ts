import { genDeclastructDao } from 'declastruct';
import { BadRequestError } from 'helpful-errors';

import type { ContextSquarespaceAgent } from '../../domain.objects/ContextSquarespaceAgent';
import { DeclaredSquarespaceDomainDnsRecord } from '../../domain.objects/DeclaredSquarespaceDomainDnsRecord';
import { getOneDnsRecord } from '../../domain.operations/domainDnsRecord/getOneDnsRecord';

/**
 * .what = DAO for DeclaredSquarespaceDomainDnsRecord
 * .why = provides a unified interface for DNS record operations
 * .note = read-only DAO; DNS mutations not supported
 */
export const DeclaredSquarespaceDomainDnsRecordDao = genDeclastructDao<
  typeof DeclaredSquarespaceDomainDnsRecord,
  ContextSquarespaceAgent
>({
  dobj: DeclaredSquarespaceDomainDnsRecord,
  get: {
    one: {
      byUnique: async (input, context) =>
        getOneDnsRecord({ by: { unique: input } }, context),
      byPrimary: null,
    },
  },
  set: {
    /**
     * .what = DNS mutations not supported
     * .why = out of scope for domain transfer workflow
     */
    findsert: async () => {
      throw new BadRequestError('DNS record mutations not supported');
    },
    upsert: null,
    delete: null,
  },
});
