import { UnexpectedCodePathError } from 'helpful-errors';

import { getDeclastructSquarespaceProvider } from '../domain.operations/provider/getDeclastructSquarespaceProvider';

/**
 * .what = factory to create real Squarespace context for integration/acceptance tests
 * .why = enables test runs against real Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 */
export const getSampleSquarespaceContext = () => {
  // fail-fast if credentials not provided
  const email = process.env.SQUARESPACE_EMAIL;
  const password = process.env.SQUARESPACE_PASSWORD;

  if (!email || !password)
    UnexpectedCodePathError.throw('squarespace credentials required', {
      hint: 'set SQUARESPACE_EMAIL and SQUARESPACE_PASSWORD environment variables',
    });

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
    browser: {
      // connect to extant browser via wsEndpoint (e.g., BROWSER_WS_ENDPOINT=ws://localhost:9222/...)
      extantBrowserWSEndpoint: process.env.BROWSER_WS_ENDPOINT,
    },
    session: {
      // persist session to disk (e.g., SESSION_STORAGE_PATH=.cache/squarespace-session.json)
      storageStatePath: process.env.SESSION_STORAGE_PATH,
    },
  });

  return provider.context;
};

/**
 * .what = asserts Squarespace credentials are available
 * .why = fail-fast for tests that require real credentials
 */
export const requireSquarespaceCredentials = (): void => {
  if (!process.env.SQUARESPACE_EMAIL || !process.env.SQUARESPACE_PASSWORD)
    UnexpectedCodePathError.throw('squarespace credentials required', {
      hint: 'set SQUARESPACE_EMAIL and SQUARESPACE_PASSWORD environment variables',
    });
};
