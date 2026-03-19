/**
 * .what = resource declarations for Squarespace acceptance tests
 * .why = defines desired state of resources for test domain transfer workflow
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD, SQUARESPACE_TOTP_SECRET environment variables
 */
import { refByUnique } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';

import {
  DeclaredSquarespaceDomainRegistration,
  DeclaredSquarespaceDomainTransferRequest,
  getDeclastructSquarespaceProvider,
} from '../../index';

/**
 * .what = provider configuration for Squarespace acceptance tests
 * .why = enables declastruct CLI to interact with Squarespace via Playwright
 */
export const getProviders = async () => {
  // fail-fast if credentials not provided
  const email = process.env.SQUARESPACE_EMAIL;
  const password = process.env.SQUARESPACE_PASSWORD;
  const totpSecret = process.env.SQUARESPACE_TOTP_SECRET;
  const accountId = process.env.SQUARESPACE_ACCOUNT_ID ?? 'acceptance-test';

  if (!email || !password)
    UnexpectedCodePathError.throw('squarespace credentials required for acceptance tests', {
      hint: 'set SQUARESPACE_EMAIL and SQUARESPACE_PASSWORD environment variables',
    });

  // create provider with credentials from environment
  const provider = getDeclastructSquarespaceProvider({
    account: {
      id: accountId,
      email,
    },
    credentials: {
      email,
      password,
      totpSecret,
    },
  });

  return [provider];
};

/**
 * .what = resource declarations for Squarespace acceptance tests
 * .why = defines desired state for domain transfer workflow
 * .note = fetches real domains from live account and declares transfer resources
 */
export const getResources = async () => {
  // get provider (fail-fast if credentials not provided)
  const [provider] = await getProviders();
  if (!provider)
    UnexpectedCodePathError.throw('provider required for acceptance test');

  // get all domains from account
  const domains = await provider.daos.DeclaredSquarespaceDomainRegistration.get.all(
    {},
    provider.context,
  );

  // fail-fast if test account has no domains
  if (domains.length === 0)
    UnexpectedCodePathError.throw('test account must have at least one domain', {
      hint: 'add a domain to the test Squarespace account',
    });

  // for each domain, declare desired transfer state:
  // 1. unlock the domain
  // 2. request transfer code
  const transferResources = domains.flatMap((domain) => [
    new DeclaredSquarespaceDomainRegistration({
      ...domain,
      isLocked: false, // unlock for transfer
      dnssecEnabled: false, // disable dnssec for transfer (per blackbox criteria usecase.4)
    }),
    new DeclaredSquarespaceDomainTransferRequest({
      domain: refByUnique<typeof DeclaredSquarespaceDomainRegistration>(domain),
      requestedAt: null,
      status: 'REQUESTED',
    }),
  ]);

  return transferResources;
};
