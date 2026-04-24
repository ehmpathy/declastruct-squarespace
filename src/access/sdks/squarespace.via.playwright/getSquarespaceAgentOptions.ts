import Bottleneck from 'bottleneck';
import type { Page } from 'playwright';
import { createCache as createInMemoryCache } from 'simple-in-memory-cache';
import { createCache as createOnDiskCache } from 'simple-on-disk-cache';

import type { BrowserAuthSession } from '@src/domain.objects/BrowserAuthSession';
import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

/**
 * .what - Compute Squarespace agent options with sensible defaults
 * .why - Simplifies agent setup with proper cache and rate limit config
 */
export const getSquarespaceAgentOptions = (input: {
  account: {
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
     * extant browser WebSocket endpoint to connect to
     * .why - allows connecting to externally managed browser
     */
    extantBrowserWSEndpoint?: string;
  };
  session?: {
    /**
     * path to persist browser session (cookies, localStorage)
     * .why - enables session reuse across test runs, reduces login frequency
     * .format - JSON file compatible with playwright storageState
     */
    storageStatePath?: string;
  };
}): ContextSquarespaceAgentOptions => {
  // create browser cache
  // .note - 4 hour expiration supports batch operations on 300+ domains
  const browserCache = createInMemoryCache<BrowserAuthSession>({
    expiration: { hours: 4 },
  });

  // create page cache
  const pageCache = createInMemoryCache<Page>({
    expiration: { minutes: 30 },
  });

  // create rate limiter for browser operations
  // .why - sequential with delay mimics human browse cadence
  // .why - reduces bot detection risk on batch operations
  // .note - 500ms chosen to balance speed (300 domains in ~2.5 hours) with safety
  const bottleneck = new Bottleneck({
    maxConcurrent: 1, // one operation at a time — no parallel ui mutations
    minTime: 500, // minimum 500ms between operations
  });

  // create remote state cache
  const cacheDirectory = input.cache?.directory ?? '.cache/squarespace';
  const remoteStateCache = createOnDiskCache({
    directory: { mounted: { path: cacheDirectory } },
    expiration: { days: 30 },
  });

  return {
    account: input.account,
    credentials: input.credentials,
    browser: {
      cache: browserCache,
      bottleneck,
      extantBrowserWSEndpoint: input.browser?.extantBrowserWSEndpoint,
    },
    page: {
      cache: pageCache,
    },
    remoteState: {
      cache: remoteStateCache,
    },
    session: input.session,
  };
};
