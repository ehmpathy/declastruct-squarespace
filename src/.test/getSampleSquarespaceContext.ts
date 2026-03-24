import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import { UnexpectedCodePathError } from 'helpful-errors';

import { getDeclastructSquarespaceProvider } from '../domain.operations/provider/getDeclastructSquarespaceProvider';

/**
 * .what - get browser wsEndpoint from env or state file
 * .why - auto-discover persistent browser started via browser.start skill
 */
const getBrowserWsEndpoint = (): string | undefined => {
  // check env var first
  if (process.env.BROWSER_WS_ENDPOINT) return process.env.BROWSER_WS_ENDPOINT;

  // check state file
  const wsEndpointFile = join(process.cwd(), '.cache/browser-ws-endpoint');
  if (existsSync(wsEndpointFile)) {
    const wsEndpoint = readFileSync(wsEndpointFile, 'utf-8').trim();
    console.log('auto-discovered browser at:', wsEndpoint);
    return wsEndpoint;
  }

  return undefined;
};

/**
 * .what = factory to create real Squarespace provider for integration/acceptance tests
 * .why = enables test runs against real Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 * .note = returns full provider so tests can call cleanup via hooks.afterAll()
 */
export const getSampleSquarespaceProvider = () => {
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
      // connect to extant browser via wsEndpoint (auto-discovered from state file or env var)
      extantBrowserWSEndpoint: getBrowserWsEndpoint(),
    },
    session: {
      // persist session to disk (e.g., SESSION_STORAGE_PATH=.cache/squarespace-session.json)
      storageStatePath: process.env.SESSION_STORAGE_PATH,
    },
  });

  return provider;
};

/**
 * .what = get context for legacy tests
 * .why = backwards compat for tests that only need context
 * .deprecated = use getSampleSquarespaceProvider() instead for proper cleanup
 */
export const getSampleSquarespaceContext = () => {
  return getSampleSquarespaceProvider().context;
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
