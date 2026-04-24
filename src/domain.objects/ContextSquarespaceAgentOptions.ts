import type Bottleneck from 'bottleneck';
import type { Page } from 'playwright';
import type { SimpleInMemoryCache } from 'simple-in-memory-cache';
import type { SimpleOnDiskCache } from 'simple-on-disk-cache';

import type { BrowserAuthSession } from './BrowserAuthSession';

/**
 * .what - Complete agent options for Squarespace Playwright automation
 * .why - Centralizes all caching, rate limiting, and browser management config
 */
export interface ContextSquarespaceAgentOptions {
  /**
   * Account to operate on
   */
  account: {
    /**
     * Account email (unique identifier)
     */
    email: string;
  };

  /**
   * Login credentials for authentication
   */
  credentials: {
    email: string;
    password: string;
    totp?: {
      /**
       * Base32-encoded TOTP secret for 2FA
       */
      secret: string;
    };
  };

  /**
   * Browser instance management
   */
  browser: {
    /**
     * Cache for browser auth session with respawn capability
     * .why - avoids repeated login overhead; supports mode switch for captcha
     */
    cache: SimpleInMemoryCache<BrowserAuthSession>;

    /**
     * Rate limiter for browser operations
     * .why - Prevents concurrent operations that could conflict
     */
    bottleneck: Bottleneck;

    /**
     * Optional existing browser WebSocket endpoint
     * .why - Allows connecting to externally managed browser
     */
    extantBrowserWSEndpoint?: string;
  };

  /**
   * Page instance management
   */
  page: {
    /**
     * Cache for reusing pages by key
     * .why - SPAs benefit from page reuse (avoid initial load)
     */
    cache: SimpleInMemoryCache<Page>;
  };

  /**
   * Remote state caching for domain operations
   */
  remoteState: {
    /**
     * Persistent cache for query results
     * .why - Survives process restarts, enables fast repeated queries
     */
    cache: SimpleOnDiskCache;
  };

  /**
   * Session persistence configuration
   */
  session?: {
    /**
     * Path to persist browser session (cookies, localStorage)
     * .why - Enables session reuse across test runs, reduces login frequency
     * .format - JSON file compatible with playwright storageState
     */
    storageStatePath?: string;
  };

  /**
   * Captcha handle configuration
   */
  captcha?: {
    /**
     * Enable headful checkbox click (tier 2)
     * .default - true
     */
    checkboxClickEnabled?: boolean;

    /**
     * Timeout for checkbox validation in ms
     * .default - 5000
     */
    checkboxTimeoutMs?: number;

    /**
     * Enable human fallback for puzzle challenges (tier 3)
     * .default - true
     */
    humanFallbackEnabled?: boolean;

    /**
     * How to signal human to solve captcha
     * - 'stdin': prompt in terminal, wait for ENTER
     * - 'file': watch for file creation at signalFilePath
     * .default - 'stdin'
     */
    humanSignalMode?: 'stdin' | 'file';

    /**
     * Path for file-based human signal
     */
    humanSignalFilePath?: string;
  };
}
