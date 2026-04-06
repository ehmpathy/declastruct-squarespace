import { genDeclastructDao } from 'declastruct';

import type { ContextSquarespaceAgent } from '../../domain.objects/ContextSquarespaceAgent';
import { DeclaredSquarespaceDomainNameservers } from '../../domain.objects/DeclaredSquarespaceDomainNameservers';
import { getNameservers } from '../../domain.operations/domainNameservers/getNameservers';
import { setNameservers } from '../../domain.operations/domainNameservers/setNameservers';

/**
 * .what = DAO for DeclaredSquarespaceDomainNameservers
 * .why = provides a unified interface for domain nameserver operations
 */
export const DeclaredSquarespaceDomainNameserversDao = genDeclastructDao<
  typeof DeclaredSquarespaceDomainNameservers,
  ContextSquarespaceAgent
>({
  dobj: DeclaredSquarespaceDomainNameservers,
  get: {
    one: {
      byUnique: async (input, context) =>
        getNameservers({ by: { unique: input } }, context),
      byPrimary: null,
    },
  },
  set: {
    /**
     * .what = findsert returns extant or sets nameservers
     * .why = enables idempotent nameserver configuration
     */
    findsert: async (input, context) =>
      setNameservers({ findsert: input }, context),
    /**
     * .what = updates domain nameservers via upsert
     * .why = enables declarative nameserver configuration
     */
    upsert: async (input, context) =>
      setNameservers({ upsert: input }, context),
    /**
     * .what = delete not supported for nameservers
     * .why = nameservers reset to squarespace default via upsert with null
     */
    delete: null,
  },
});
