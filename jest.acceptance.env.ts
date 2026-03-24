import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import util from 'util';

// set NODE_ENV to test mode
// .why = ensures test mode detection works (e.g., never close pages in test mode)
process.env.NODE_ENV = 'test';

// eslint-disable-next-line no-undef
jest.setTimeout(90000); // we call downstream apis

// set console.log to not truncate nested objects
util.inspect.defaultOptions.depth = 5;

/**
 * .what = verify that we're running from a valid project directory; otherwise, fail fast
 * .why = prevent confusion and hard-to-debug errors from running tests in the wrong directory
 */
if (!existsSync(join(process.cwd(), 'package.json')))
  throw new Error('no package.json found in cwd. are you @gitroot?');

/**
 * .what = fetch squarespace credentials from keyrack
 * .why = tests require real credentials; keyrack provides secure access
 * .note = must unlock before get for ehmpath owner
 */
const fetchKeyFromKeyrack = (key: string): string | null => {
  try {
    // unlock ehmpath keyrack first (requires prikey)
    execSync(
      `npx rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --key ${key} --env test`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
    );

    // now get the key
    const result = execSync(
      `npx rhx keyrack get --owner ehmpath --key ${key} --env test --json`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
    );
    const parsed = JSON.parse(result);
    return parsed.grant?.key?.secret ?? null;
  } catch {
    return null;
  }
};

// fetch squarespace credentials from keyrack (if not already in env)
if (!process.env.SQUARESPACE_EMAIL) {
  const email = fetchKeyFromKeyrack('SQUARESPACE_EMAIL');
  if (email) process.env.SQUARESPACE_EMAIL = email;
}
if (!process.env.SQUARESPACE_PASSWORD) {
  const password = fetchKeyFromKeyrack('SQUARESPACE_PASSWORD');
  if (password) process.env.SQUARESPACE_PASSWORD = password;
}
if (!process.env.SQUARESPACE_TOTP_SECRET) {
  const totpSecret = fetchKeyFromKeyrack('SQUARESPACE_TOTP_SECRET');
  if (totpSecret) process.env.SQUARESPACE_TOTP_SECRET = totpSecret;
}

/**
 * .what = auto-discover persistent browser via state file
 * .why = browser.start skill writes wsEndpoint to file for tests to find
 * .note = uses session-based path: .cache/browser.$session/ws-endpoint
 */
if (!process.env.BROWSER_WS_ENDPOINT) {
  const wsEndpointFile = join(process.cwd(), '.cache/browser.default/ws-endpoint');
  if (existsSync(wsEndpointFile)) {
    process.env.BROWSER_WS_ENDPOINT = readFileSync(wsEndpointFile, 'utf-8').trim();
    console.log('auto-discovered browser at:', process.env.BROWSER_WS_ENDPOINT);
  }
}

/**
 * .what = verify that the env has sufficient auth to run the tests if aws is used; otherwise, fail fast
 * .why =
 *   - prevent time wasted waiting on tests to fail due to lack of credentials
 *   - prevent time wasted debugging tests which are failing due to hard-to-read missed credential errors
 */
const declapractUsePath = join(process.cwd(), 'declapract.use.yml');
const requiresAwsAuth =
  existsSync(declapractUsePath) &&
  readFileSync(declapractUsePath, 'utf8').includes('awsAccountId');
if (
  requiresAwsAuth &&
  !(process.env.AWS_PROFILE || process.env.AWS_ACCESS_KEY_ID)
)
  throw new Error(
    'no aws credentials present. please authenticate with aws to run acceptance tests',
  );
