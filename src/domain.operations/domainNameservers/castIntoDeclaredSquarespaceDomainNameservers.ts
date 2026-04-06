import { RefByUnique } from 'domain-objects';

import type { RawDomainDetail } from '../../access/sdks/squarespace.via.playwright/domainDetail/scrapeDomainDetail';
import { DeclaredSquarespaceDomainNameservers } from '../../domain.objects/DeclaredSquarespaceDomainNameservers';
import type { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';

/**
 * .what = determines if nameservers are squarespace defaults
 * .why = squarespace default nameservers contain "squarespace" in hostname
 */
const isSquarespaceDefaultNameservers = (input: {
  nameservers: string[];
}): boolean => {
  // empty array is squarespace default
  if (input.nameservers.length === 0) return true;

  // check if any nameserver contains "squarespace"
  return input.nameservers.some((ns) =>
    ns.toLowerCase().includes('squarespace'),
  );
};

/**
 * .what = casts raw domain detail into typed DeclaredSquarespaceDomainNameservers
 * .why = transforms scraped data into domain object for type-safe operations
 */
export const castIntoDeclaredSquarespaceDomainNameservers = (input: {
  raw: RawDomainDetail;
}): DeclaredSquarespaceDomainNameservers => {
  // determine if squarespace default
  const isDefault = isSquarespaceDefaultNameservers({
    nameservers: input.raw.nameservers,
  });

  // construct nameservers entity
  return new DeclaredSquarespaceDomainNameservers({
    domain: RefByUnique.as<typeof DeclaredSquarespaceDomainRegistration>({
      name: input.raw.name,
    }),
    nameservers: isDefault ? null : input.raw.nameservers,
  });
};
