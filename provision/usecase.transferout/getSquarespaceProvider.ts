/**
 * .what = shared provider configuration for transferout usecase
 * .why = reusable across all steps, cached for single instantiation
 */
import type { DeclastructProvider } from 'declastruct';
import { existsSync, readFileSync } from 'fs';
import { UnexpectedCodePathError } from 'helpful-errors';
import { join } from 'path';
import { keyrack } from 'rhachet/keyrack';
import { createCache } from 'simple-in-memory-cache';
import { withSimpleCache } from 'with-simple-cache';

import { getDeclastructSquarespaceProvider } from '../../src/contract/sdks/index';

const _getSquarespaceProvider = (): DeclastructProvider => {
  const env = (process.env.ENV ?? 'prod') as 'test' | 'prod';
  const owner = env === 'test' ? 'ehmpath' : 'default';

  // source credentials from keyrack into process.env
  keyrack.source({ env, owner });

  const email = process.env.SQUARESPACE_EMAIL;
  const password = process.env.SQUARESPACE_PASSWORD;
  const totpSecret = process.env.SQUARESPACE_TOTP_SECRET;

  if (!email || !password)
    UnexpectedCodePathError.throw('squarespace credentials required', {
      hint: `ensure keyrack has credentials for env=${env}`,
    });

  // auto-discover persistent browser
  let browserEndpoint = process.env.BROWSER_WS_ENDPOINT;
  if (!browserEndpoint) {
    const wsEndpointFile = join(
      process.cwd(),
      '.cache/browser.default/ws-endpoint',
    );
    if (existsSync(wsEndpointFile)) {
      browserEndpoint = readFileSync(wsEndpointFile, 'utf-8').trim();
    }
  }

  return getDeclastructSquarespaceProvider({
    account: { id: 'transferout', email },
    credentials: { email, password, totpSecret: totpSecret ?? undefined },
    browser: { extantBrowserWSEndpoint: browserEndpoint },
    session: { storageStatePath: '.cache/squarespace-session.json' },
  });
};

export const getSquarespaceProvider = withSimpleCache(_getSquarespaceProvider, {
  cache: createCache(),
});

export const getProviders = async (): Promise<DeclastructProvider[]> => [
  getSquarespaceProvider(),
];
