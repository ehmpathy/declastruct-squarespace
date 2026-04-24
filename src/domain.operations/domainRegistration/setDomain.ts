import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import type { PickOne } from 'type-fns';

import { scrapeDomainDetail } from '../../access/sdks/squarespace.via.playwright/domainDetail/scrapeDomainDetail';
import { toggleDnssec } from '../../access/sdks/squarespace.via.playwright/domainDetail/toggleDnssec';
import { toggleDomainLock } from '../../access/sdks/squarespace.via.playwright/domainDetail/toggleDomainLock';
import { toggleRenewal } from '../../access/sdks/squarespace.via.playwright/domainDetail/toggleRenewal';
import { withNewLoggedInBrowserPage } from '../../access/sdks/squarespace.via.playwright/wrappers/withNewLoggedInBrowserPage';
import type {
  ContextSquarespaceAgent,
  ContextSquarespaceAgentPage,
} from '../../domain.objects/ContextSquarespaceAgent';
import type { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';
import { withRemoteStateMutationRegistration } from '../../infra/performance/withRemoteStateCache';
import { castIntoDeclaredSquarespaceDomainRegistration } from './castIntoDeclaredSquarespaceDomainRegistration';
import { addTriggerToGetAllDomains, getAllDomains } from './getAllDomains';

type SetDomainInput = PickOne<{
  findsert: Pick<DeclaredSquarespaceDomainRegistration, 'name'> &
    Partial<
      Pick<
        DeclaredSquarespaceDomainRegistration,
        'isLocked' | 'dnssecEnabled' | 'renewal'
      >
    >;
  upsert: Pick<DeclaredSquarespaceDomainRegistration, 'name'> &
    Partial<
      Pick<
        DeclaredSquarespaceDomainRegistration,
        'isLocked' | 'dnssecEnabled' | 'renewal'
      >
    >;
}>;

/**
 * .what = core page-level implementation of setDomain
 * .why = performs UI mutations only; domain lookup is done outside to avoid bottleneck deadlock
 */
const setDomainCore = async (
  input: SetDomainInput,
  context: ContextSquarespaceAgentPage,
  domainFound: DeclaredSquarespaceDomainRegistration,
): Promise<DeclaredSquarespaceDomainRegistration> => {
  const { page, agentOptions } = context;
  const domainDesired = input.findsert ?? input.upsert;

  // apply changes
  const changes: string[] = [];

  // handle lock status change
  if (
    domainDesired.isLocked !== undefined &&
    domainDesired.isLocked !== domainFound.isLocked
  ) {
    // pre-check: fail fast if domain has a lock restriction that prevents unlock
    if (domainDesired.isLocked === false && domainFound.lockReason) {
      throw new BadRequestError(
        'domain cannot be unlocked due to lock restriction',
        {
          domain: domainDesired.name,
          lockReason: domainFound.lockReason,
          hint: 'wait for lock period to expire before transfer',
        },
      );
    }

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

  // handle renewal change
  if (
    domainDesired.renewal !== undefined &&
    domainDesired.renewal !== domainFound.renewal
  ) {
    const renewalResult = await toggleRenewal({
      page,
      domain: domainDesired.name,
      targetState: domainDesired.renewal,
      credentials: agentOptions.credentials,
    });

    if (!renewalResult.success) {
      throw new BadRequestError('failed to toggle renewal', {
        domain: domainDesired.name,
        targetState: domainDesired.renewal,
        result: renewalResult,
      });
    }

    changes.push(`renewal: ${domainFound.renewal} -> ${domainDesired.renewal}`);
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
    dnssecEnabled: domainDesired.dnssecEnabled ?? domainFound.dnssecEnabled,
    createdAt: domainFound.createdAt,
    renewal: domainDesired.renewal ?? domainFound.renewal,
  });
};

/**
 * .what = orchestrates setDomain: fetches domain first, then mutates via page
 * .why = getAllDomains MUST be called OUTSIDE withNewLoggedInBrowserPage to avoid
 *        re-entrant bottleneck deadlock (both use maxConcurrent: 1)
 */
const setDomainWithPage = async (
  input: SetDomainInput,
  context: ContextSquarespaceAgent,
): Promise<DeclaredSquarespaceDomainRegistration> => {
  const domainDesired = input.findsert ?? input.upsert;

  // validate domain name provided
  if (!domainDesired?.name)
    UnexpectedCodePathError.throw('no domain name in input', { input });

  // fetch current state OUTSIDE page wrapper to avoid bottleneck deadlock
  const domainsAll = await getAllDomains({}, context);
  const domainFound = domainsAll.find(
    (d: DeclaredSquarespaceDomainRegistration) => d.name === domainDesired.name,
  );

  // domain must exist to be set
  if (!domainFound) {
    throw new BadRequestError('domain not found in account', {
      domainName: domainDesired.name,
    });
  }

  // for findsert, return if no changes needed (skip page access entirely)
  if (input.findsert) {
    const noLockChange =
      input.findsert.isLocked === undefined ||
      input.findsert.isLocked === domainFound.isLocked;
    const noDnssecChange =
      input.findsert.dnssecEnabled === undefined ||
      input.findsert.dnssecEnabled === domainFound.dnssecEnabled;
    const noRenewalChange =
      input.findsert.renewal === undefined ||
      input.findsert.renewal === domainFound.renewal;

    if (noLockChange && noDnssecChange && noRenewalChange) {
      return domainFound;
    }
  }

  // now get page and perform mutations (sequential bottleneck use, not nested)
  const wrappedCore = withNewLoggedInBrowserPage(
    (coreInput: SetDomainInput, pageContext: ContextSquarespaceAgentPage) =>
      setDomainCore(coreInput, pageContext, domainFound),
    { reusePageKey: 'domainDetail' },
  );

  return wrappedCore(input, context);
};

/**
 * .what = mutation-registered setDomain operation
 * .why = enables cache invalidation of getAllDomains on mutation
 */
const setDomainMutation = withRemoteStateMutationRegistration(
  setDomainWithPage,
  { name: { override: 'setDomain' } },
);

// register cache update trigger (mutate cache in place, don't invalidate)
addTriggerToGetAllDomains({
  updatedBy: {
    mutation: setDomainMutation,
    affects: ({ cachedQueryKeys }: { cachedQueryKeys: string[] }) => ({
      // filter to only getAllDomains cache keys (not getNameservers, etc.)
      keys: cachedQueryKeys.filter((key) => key.startsWith('getAllDomains.')),
    }),
    update: async ({
      from: { cachedQueryOutput },
      with: { mutationOutput },
    }: {
      // .note = cachedQueryOutput is wrapped in a Promise by with-remote-state-cache
      from: { cachedQueryOutput: Promise<DeclaredSquarespaceDomainRegistration[]> };
      // .note = mutationOutput is null on pre-mutation call, present on post-mutation
      with: { mutationOutput: DeclaredSquarespaceDomainRegistration | null };
    }) => {
      // await the cached output (it's wrapped in a promise by the cache lib)
      const domains = await cachedQueryOutput;
      // skip update on pre-mutation call (mutationOutput is null before mutation runs)
      if (!mutationOutput) return domains;
      // replace the updated domain in the cached list
      return domains.map((domain) =>
        domain.name === mutationOutput.name ? mutationOutput : domain,
      );
    },
  },
});

/**
 * .what = sets domain configuration (lock status, dnssec, renewal)
 * .why = enables domain transfer preparation via declarative interface
 */
export const setDomain = setDomainMutation.execute;
