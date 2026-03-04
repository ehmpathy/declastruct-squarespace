import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import { scrapeDomainDetail } from '../../access/sdks/playwright/domainDetail/scrapeDomainDetail';
import { toggleDnssec } from '../../access/sdks/playwright/domainDetail/toggleDnssec';
import { toggleDomainLock } from '../../access/sdks/playwright/domainDetail/toggleDomainLock';
import { withNewLoggedInBrowserPage } from '../../access/sdks/playwright/wrappers/withNewLoggedInBrowserPage';
import type { ContextSquarespaceAgentPage } from '../../domain.objects/ContextSquarespaceAgent';
import type { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';
import { withRemoteStateMutationRegistration } from '../../infra/performance/withRemoteStateCache';
import { castIntoDeclaredSquarespaceDomainRegistration } from './castIntoDeclaredSquarespaceDomainRegistration';
import { addTriggerToGetAllDomains, getAllDomains } from './getAllDomains';

/**
 * .what = internal implementation of setDomain with page access
 * .why = separates page logic from caching and wrapping concerns
 */
const setDomainWithPage = async (
  input: PickOne<{
    findsert: Pick<DeclaredSquarespaceDomainRegistration, 'name'> &
      Partial<
        Pick<
          DeclaredSquarespaceDomainRegistration,
          'isLocked' | 'dnssecEnabled'
        >
      >;
    upsert: Pick<DeclaredSquarespaceDomainRegistration, 'name'> &
      Partial<
        Pick<
          DeclaredSquarespaceDomainRegistration,
          'isLocked' | 'dnssecEnabled'
        >
      >;
  }>,
  context: ContextSquarespaceAgentPage,
): Promise<DeclaredSquarespaceDomainRegistration> => {
  const { page, agentOptions } = context;
  const domainDesired = input.findsert ?? input.upsert;

  // validate domain name provided
  if (!domainDesired?.name)
    UnexpectedCodePathError.throw('no domain name in input', { input });

  // fetch current state from getAllDomains cache
  const domainsAll = await getAllDomains({}, context);
  const domainFound = domainsAll.find((d) => d.name === domainDesired.name);

  // domain must exist to be set
  if (!domainFound) {
    throw new BadRequestError('domain not found in account', {
      domainName: domainDesired.name,
    });
  }

  // for findsert, return if no changes needed
  if (input.findsert) {
    const noLockChange =
      input.findsert.isLocked === undefined ||
      input.findsert.isLocked === domainFound.isLocked;
    const noDnssecChange =
      input.findsert.dnssecEnabled === undefined ||
      input.findsert.dnssecEnabled === domainFound.dnssecEnabled;

    if (noLockChange && noDnssecChange) {
      return domainFound;
    }
  }

  // apply changes
  const changes: string[] = [];

  // handle lock status change
  if (
    domainDesired.isLocked !== undefined &&
    domainDesired.isLocked !== domainFound.isLocked
  ) {
    const lockResult = await toggleDomainLock({
      page,
      domain: domainDesired.name,
      targetState: domainDesired.isLocked ? 'locked' : 'unlocked',
      credentials: agentOptions.credentials,
    });

    if (!lockResult.success) {
      throw new BadRequestError('failed to toggle domain lock', {
        domain: domainDesired.name,
        targetState: domainDesired.isLocked,
        result: lockResult,
      });
    }

    changes.push(
      `isLocked: ${domainFound.isLocked} -> ${domainDesired.isLocked}`,
    );
  }

  // handle dnssec change
  if (
    domainDesired.dnssecEnabled !== undefined &&
    domainDesired.dnssecEnabled !== domainFound.dnssecEnabled
  ) {
    const dnssecResult = await toggleDnssec({
      page,
      domain: domainDesired.name,
      targetState: domainDesired.dnssecEnabled ? 'enabled' : 'disabled',
      credentials: agentOptions.credentials,
    });

    if (!dnssecResult.success) {
      throw new BadRequestError('failed to toggle dnssec', {
        domain: domainDesired.name,
        targetState: domainDesired.dnssecEnabled,
        result: dnssecResult,
      });
    }

    changes.push(
      `dnssecEnabled: ${domainFound.dnssecEnabled} -> ${domainDesired.dnssecEnabled}`,
    );
  }

  // if no changes were made, return current state
  if (changes.length === 0) {
    return domainFound;
  }

  // scrape fresh domain detail to return accurate state
  const detailAfter = await scrapeDomainDetail({
    page,
    domain: domainDesired.name,
  });

  // cast and return updated domain
  return castIntoDeclaredSquarespaceDomainRegistration({
    raw: detailAfter,
    autoRenew: domainFound.autoRenew,
    dnssecEnabled: domainDesired.dnssecEnabled ?? domainFound.dnssecEnabled,
    createdAt: domainFound.createdAt,
  });
};

/**
 * .what = mutation-registered setDomain operation
 * .why = enables cache invalidation of getAllDomains on mutation
 */
const setDomainMutation = withRemoteStateMutationRegistration(
  withNewLoggedInBrowserPage(setDomainWithPage, {
    reusePageKey: 'domainDetail',
  }),
  { name: 'setDomain' },
);

// register cache invalidation trigger
addTriggerToGetAllDomains({
  invalidatedBy: {
    mutation: setDomainMutation,
    affects: ({ cachedQueryKeys }) => ({ keys: cachedQueryKeys }),
  },
});

/**
 * .what = sets domain configuration (lock status, dnssec)
 * .why = enables domain transfer preparation via declarative interface
 */
export const setDomain = setDomainMutation.execute;
