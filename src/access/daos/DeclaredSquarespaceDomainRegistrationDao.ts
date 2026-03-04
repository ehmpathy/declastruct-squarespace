import type { RefByUnique } from 'domain-objects';

import type { ContextSquarespaceAgent } from '../../domain.objects/ContextSquarespaceAgent';
import type { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';
import { getAllDomains } from '../../domain.operations/domainRegistration/getAllDomains';
import { getOneDomain } from '../../domain.operations/domainRegistration/getOneDomain';
import { setDomain } from '../../domain.operations/domainRegistration/setDomain';

/**
 * .what = DAO for DeclaredSquarespaceDomainRegistration
 * .why = provides a unified interface for domain registration operations
 */
export const DeclaredSquarespaceDomainRegistrationDao = {
  get: {
    /**
     * .what = gets a single domain by unique key
     * .why = enables lookup of specific domain by name
     */
    one: {
      byUnique: async (
        input: {
          unique: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>;
        },
        context: ContextSquarespaceAgent,
      ): Promise<DeclaredSquarespaceDomainRegistration | null> =>
        getOneDomain({ by: { unique: input.unique } }, context),
    },

    /**
     * .what = gets all domains from the Squarespace account
     * .why = enables batch operations across all domains
     */
    all: async (
      _input: Record<string, never>,
      context: ContextSquarespaceAgent,
    ): Promise<DeclaredSquarespaceDomainRegistration[]> =>
      getAllDomains({}, context),
  },

  set: {
    /**
     * .what = updates domain configuration via upsert
     * .why = enables declarative domain configuration (lock status, dnssec)
     */
    upsert: async (
      input: {
        entity: Pick<DeclaredSquarespaceDomainRegistration, 'name'> &
          Partial<
            Pick<
              DeclaredSquarespaceDomainRegistration,
              'isLocked' | 'dnssecEnabled'
            >
          >;
      },
      context: ContextSquarespaceAgent,
    ): Promise<DeclaredSquarespaceDomainRegistration> =>
      setDomain({ upsert: input.entity }, context),

    /**
     * .what = findsert not supported for domains
     * .why = domains are created via registration, not programmatically
     */
    findsert: null,

    /**
     * .what = delete not supported for domains
     * .why = domain deletion is a separate workflow outside scope
     */
    delete: null,
  },
};
