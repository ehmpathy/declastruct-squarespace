/**
 * .what = resource declarations for Squarespace acceptance tests
 * .why = defines desired state of resources for testing domain transfer workflow
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD, SQUARESPACE_TOTP_SECRET environment variables
 */
import { getDeclastructSquarespaceProvider } from '../../index';

/**
 * .what = provider configuration for Squarespace acceptance tests
 * .why = enables declastruct CLI to interact with Squarespace via Playwright
 */
export const getProviders = async () => {
  // validate required environment variables
  const email = process.env.SQUARESPACE_EMAIL;
  const password = process.env.SQUARESPACE_PASSWORD;
  const totpSecret = process.env.SQUARESPACE_TOTP_SECRET;
  const accountId = process.env.SQUARESPACE_ACCOUNT_ID ?? 'acceptance-test';

  // skip if credentials not provided
  if (!email || !password) return [];

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
 * .note = returns empty array for now - real resources require live domain for testing
 */
export const getResources = async () => {
  // note: real resource declarations would look like this:
  // const [provider] = await getProviders();
  // if (!provider) return [];
  //
  // // get all domains from account
  // const domains = await provider.daos.DeclaredSquarespaceDomainRegistration.get.all(
  //   {},
  //   provider.context,
  // );
  //
  // // for each domain to transfer, declare desired state:
  // // 1. unlock the domain
  // // 2. request transfer code
  // const transferResources = domains.flatMap((domain) => [
  //   new DeclaredSquarespaceDomainRegistration({
  //     ...domain,
  //     isLocked: false, // unlock for transfer
  //   }),
  //   new DeclaredSquarespaceDomainTransferRequest({
  //     domain: { domainName: domain.domainName },
  //   }),
  // ]);
  //
  // return transferResources;

  return [];
};
