import { getDeclastructSquarespaceProvider } from '../domain.operations/provider/getDeclastructSquarespaceProvider';

/**
 * .what = factory for creating real Squarespace context for integration/acceptance tests
 * .why = enables testing against real Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 */
export const getSampleSquarespaceContext = () => {
  // validate required environment variables
  const email = process.env.SQUARESPACE_EMAIL;
  const password = process.env.SQUARESPACE_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'getSampleSquarespaceContext requires SQUARESPACE_EMAIL and SQUARESPACE_PASSWORD environment variables',
    );
  }

  // create provider with credentials from environment
  const provider = getDeclastructSquarespaceProvider({
    account: {
      id: process.env.SQUARESPACE_ACCOUNT_ID ?? 'integration-test',
      email,
    },
    credentials: {
      email,
      password,
      totpSecret: process.env.SQUARESPACE_TOTP_SECRET,
    },
  });

  return provider.context;
};

/**
 * .what = checks if Squarespace credentials are available
 * .why = allows tests to skip gracefully when credentials not provided
 */
export const hasSquarespaceCredentials = (): boolean => {
  return !!(
    process.env.SQUARESPACE_EMAIL && process.env.SQUARESPACE_PASSWORD
  );
};
