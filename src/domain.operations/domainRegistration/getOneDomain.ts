import type { Ref, RefByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import type { ContextSquarespaceAgent } from '../../domain.objects/ContextSquarespaceAgent';
import type { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';
import { getAllDomains } from './getAllDomains';

/**
 * .what = gets a single domain by unique key
 * .why = enables lookup of specific domain without full list handling
 * .note = delegates to getAllDomains and filters in-memory (no separate cache)
 */
export const getOneDomain = async (
  input: {
    by: PickOne<{
      unique: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>;
      ref: Ref<typeof DeclaredSquarespaceDomainRegistration>;
    }>;
  },
  context: ContextSquarespaceAgent,
): Promise<DeclaredSquarespaceDomainRegistration | null> => {
  // extract the domain name from input
  const domainName =
    input.by.unique?.name ??
    input.by.ref?.name ??
    UnexpectedCodePathError.throw('no domain name provided', { input });

  // fetch all domains (cached)
  const domains = await getAllDomains({}, context);

  // filter to find the requested domain
  const domainFound = domains.find((domain) => domain.name === domainName);

  // return domain or null if not found
  return domainFound ?? null;
};
