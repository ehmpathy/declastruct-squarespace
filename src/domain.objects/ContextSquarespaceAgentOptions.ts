import type Bottleneck from 'bottleneck';
import type { Browser, BrowserContext, Page } from 'playwright';
import type { SimpleInMemoryCache } from 'simple-in-memory-cache';
import type { SimpleOnDiskCache } from 'simple-on-disk-cache';

/**
 * .what - Complete agent options for Squarespace Playwright automation
 * .why - Centralizes all caching, rate limiting, and browser management config
 */
export interface ContextSquarespaceAgentOptions {
  /**
   * Account being operated on
   */
  account: {
    /**
     * Unique identifier for cache namespacing
     */
    id: string;

    /**
     * Account email (for display/logging)
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
     * Cache for reusing logged-in browser instances
     * .why - Avoids repeated login overhead
     */
    cache: SimpleInMemoryCache<{
      browser: Browser;
      context: BrowserContext;
      close: () => Promise<void>;
    }>;

    /**
     * Rate limiter for browser operations
     * .why - Prevents concurrent operations that could conflict
     */
    bottleneck: Bottleneck;

    /**
     * Optional existing browser WebSocket endpoint
     * .why - Allows connecting to externally managed browser
     */
    existingBrowserWSEndpoint?: string;
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
}
