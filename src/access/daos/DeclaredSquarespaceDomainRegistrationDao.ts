import { genDeclastructDao } from 'declastruct';

import type { ContextSquarespaceAgent } from '../../domain.objects/ContextSquarespaceAgent';
import { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';
import { getOneDomain } from '../../domain.operations/domainRegistration/getOneDomain';
import { setDomain } from '../../domain.operations/domainRegistration/setDomain';

/**
 * .what = DAO for DeclaredSquarespaceDomainRegistration
 * .why = provides a unified interface for domain registration operations
 */
export const DeclaredSquarespaceDomainRegistrationDao = genDeclastructDao<
  typeof DeclaredSquarespaceDomainRegistration,
  ContextSquarespaceAgent
>({
  dobj: DeclaredSquarespaceDomainRegistration,
  get: {
    one: {
      byUnique: async (input, context) =>
        getOneDomain({ by: { unique: input } }, context),
      byPrimary: null,
    },
  },
  set: {
    /**
     * .what = findsert uses upsert semantics
     * .why = domains exist or don't; findsert returns extant or errors
     */
    findsert: async (input, context) => setDomain({ findsert: input }, context),
    /**
     * .what = updates domain configuration via upsert
     * .why = enables declarative domain configuration (lock status, dnssec)
     */
    upsert: async (input, context) => setDomain({ upsert: input }, context),
    /**
     * .what = delete not supported for domains
     * .why = domain deletion is a separate workflow outside scope
     */
    delete: null,
  },
});
