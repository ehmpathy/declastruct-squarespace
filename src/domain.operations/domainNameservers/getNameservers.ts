import { RefByUnique } from 'domain-objects';
import type { PickOne } from 'type-fns';

import { getNameserversScraper } from '../../access/sdks/squarespace.via.playwright/domainNameservers/getNameserversScraper';
import { withNewLoggedInBrowserPage } from '../../access/sdks/squarespace.via.playwright/wrappers/withNewLoggedInBrowserPage';
import type { ContextSquarespaceAgentPage } from '../../domain.objects/ContextSquarespaceAgent';
import { DeclaredSquarespaceDomainNameservers } from '../../domain.objects/DeclaredSquarespaceDomainNameservers';
import type { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';

/**
 * .what = internal implementation of getNameservers
 * .why = separates page logic from wrapper concerns
 */
const getNameserversFromPage = async (
  input: {
    by: PickOne<{
      unique: RefByUnique<typeof DeclaredSquarespaceDomainNameservers>;
    }>;
  },
  context: ContextSquarespaceAgentPage,
): Promise<DeclaredSquarespaceDomainNameservers> => {
  const { page } = context;

  // extract domain name from unique key
  const domainName = input.by.unique.domain.name;

  // scrape nameservers from dedicated nameservers page
  const result = await getNameserversScraper({
    page,
    domain: domainName,
  });

  // construct domain object
  return new DeclaredSquarespaceDomainNameservers({
    domain: RefByUnique.as<typeof DeclaredSquarespaceDomainRegistration>({
      name: domainName,
    }),
    nameservers: result.nameservers,
  });
};

/**
 * .what = gets nameservers for a domain
 * .why = enables lookup of domain nameserver configuration
 */
export const getNameservers = withNewLoggedInBrowserPage(
  getNameserversFromPage,
);
