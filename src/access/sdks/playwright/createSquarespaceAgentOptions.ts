import Bottleneck from 'bottleneck';
import type { Page } from 'playwright';
import { createCache as createInMemoryCache } from 'simple-in-memory-cache';
import { createCache as createOnDiskCache } from 'simple-on-disk-cache';

import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import type { LoggedInBrowser } from './browser/findOrCreateLoggedInBrowser';

/**
 * .what - Factory to create Squarespace agent options with sensible defaults
 * .why - Simplifies agent creation with proper caching and rate limiting setup
 */
export const createSquarespaceAgentOptions = (input: {
  account: {
    id: string;
    email: string;
  };
  credentials: {
    email: string;
    password: string;
    totp?: {
      secret: string;
    };
  };
  cache?: {
    /**
     * directory for persistent cache storage
     * .default - '.cache/squarespace'
     */
    directory?: string;
  };
  browser?: {
    /**
     * existing browser WebSocket endpoint to connect to
     * .why - allows connecting to externally managed browser
     */
    existingBrowserWSEndpoint?: string;
  };
}): ContextSquarespaceAgentOptions => {
  // create browser cache
  const browserCache = createInMemoryCache<LoggedInBrowser>({
    expiration: { hours: 1 },
  });

  // create page cache
  const pageCache = createInMemoryCache<Page>({
    expiration: { minutes: 30 },
  });

  // create rate limiter for browser operations (one at a time)
  const bottleneck = new Bottleneck({
    maxConcurrent: 1,
    minTime: 500, // 500ms between operations
  });

  // create remote state cache
  const cacheDirectory = input.cache?.directory ?? '.cache/squarespace';
  const remoteStateCache = createOnDiskCache({
    directory: { mounted: { path: cacheDirectory } },
    expiration: { hours: 24 },
  });

  return {
    account: input.account,
    credentials: input.credentials,
    browser: {
      cache: browserCache,
      bottleneck,
      existingBrowserWSEndpoint: input.browser?.existingBrowserWSEndpoint,
    },
    page: {
      cache: pageCache,
    },
    remoteState: {
      cache: remoteStateCache,
    },
  };
};
