import { RefByUnique, serialize } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import { setNameserversScraper } from '../../access/sdks/squarespace.via.playwright/domainNameservers/setNameserversScraper';
import { withNewLoggedInBrowserPage } from '../../access/sdks/squarespace.via.playwright/wrappers/withNewLoggedInBrowserPage';
import type {
  ContextSquarespaceAgent,
  ContextSquarespaceAgentPage,
} from '../../domain.objects/ContextSquarespaceAgent';
import { DeclaredSquarespaceDomainNameservers } from '../../domain.objects/DeclaredSquarespaceDomainNameservers';
import type { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';
import { getNameservers } from './getNameservers';
import { validateNameserversInput } from './validateNameserversInput';

type SetNameserversInput = PickOne<{
  findsert: DeclaredSquarespaceDomainNameservers;
  upsert: DeclaredSquarespaceDomainNameservers;
}>;

/**
 * .what = core page-level implementation of setNameservers
 * .why = performs UI mutations only
 */
const setNameserversCore = async (
  input: SetNameserversInput,
  context: ContextSquarespaceAgentPage,
  currentNameservers: DeclaredSquarespaceDomainNameservers,
): Promise<DeclaredSquarespaceDomainNameservers> => {
  const { page, agentOptions } = context;
  const desired = input.findsert ?? input.upsert;

  // validate nameservers input
  const nameserversValidated = validateNameserversInput({
    nameservers: desired.nameservers,
  });

  // check if change is needed
  const currentSerialized = serialize(currentNameservers.nameservers);
  const desiredSerialized = serialize(nameserversValidated);
  const noChangeNeeded = currentSerialized === desiredSerialized;

  // for findsert, return current state if no change needed
  if (input.findsert && noChangeNeeded) {
    return currentNameservers;
  }

  // for upsert, also skip if no change needed
  if (noChangeNeeded) {
    return currentNameservers;
  }

  // apply the change via scraper
  const result = await setNameserversScraper({
    page,
    domain: desired.domain.name,
    nameservers: nameserversValidated,
    credentials: agentOptions.credentials,
  });

  if (!result.success) {
    throw new UnexpectedCodePathError('failed to set nameservers', {
      domain: desired.domain.name,
      nameservers: nameserversValidated,
      result,
    });
  }

  // return the updated entity
  return new DeclaredSquarespaceDomainNameservers({
    domain: RefByUnique.as<typeof DeclaredSquarespaceDomainRegistration>({
      name: desired.domain.name,
    }),
    nameservers: result.nameservers,
  });
};

/**
 * .what = orchestrates setNameservers: fetches current state first, then mutates via page
 * .why = getNameservers MUST be called OUTSIDE withNewLoggedInBrowserPage to avoid
 *        re-entrant bottleneck deadlock (both use maxConcurrent: 1)
 */
const setNameserversWithPage = async (
  input: SetNameserversInput,
  context: ContextSquarespaceAgent,
): Promise<DeclaredSquarespaceDomainNameservers> => {
  const desired = input.findsert ?? input.upsert;

  // validate domain reference provided
  if (!desired?.domain?.name)
    UnexpectedCodePathError.throw('no domain name in input', { input });

  // validate nameservers input early (before page access)
  validateNameserversInput({ nameservers: desired.nameservers });

  // fetch current state OUTSIDE page wrapper to avoid bottleneck deadlock
  const currentNameservers = await getNameservers(
    { by: { unique: { domain: { name: desired.domain.name } } } },
    context,
  );

  // for findsert with no change needed, return early (skip page access)
  if (input.findsert) {
    const currentSerialized = serialize(currentNameservers.nameservers);
    const desiredSerialized = serialize(desired.nameservers);
    if (currentSerialized === desiredSerialized) {
      return currentNameservers;
    }
  }

  // now get page and perform mutations (sequential bottleneck use, not nested)
  const wrappedCore = withNewLoggedInBrowserPage(
    (
      coreInput: SetNameserversInput,
      pageContext: ContextSquarespaceAgentPage,
    ) => setNameserversCore(coreInput, pageContext, currentNameservers),
    { reusePageKey: 'domainNameservers' },
  );

  return wrappedCore(input, context);
};

/**
 * .what = sets nameservers for a domain
 * .why = enables declarative control over domain nameserver configuration
 */
export const setNameservers = setNameserversWithPage;
