import type { Browser, BrowserContext } from 'playwright';

/**
 * .what - browser mode for automation
 * .why - headless for normal ops, headful for captcha solve
 */
export type BrowserMode = 'HEADLESS' | 'HEADFUL';

/**
 * .what - browser session with respawn capability
 * .why - shared handle enables mode switch that affects all consumers
 * .note - replaces LoggedInBrowser; adds respawn() and storage.get/set
 */
export interface BrowserAuthSession {
  browser: Browser;
  context: BrowserContext;
  mode: BrowserMode;
  close: () => Promise<void>;

  /**
   * .what - respawn browser in different mode
   * .why - captcha pivot requires headful; switch back after solve
   * .note - automatically calls storage.set() before close, storage.get() after spawn
   */
  respawn: (input: { mode: BrowserMode }) => Promise<void>;

  /**
   * .what - session storage operations
   * .why - persist/restore session for respawn and ad-hoc usage
   */
  storage: {
    /**
     * .what - restore storageState from disk into context
     * .why - load saved cookies and localStorage after browser spawn
     */
    get: () => Promise<void>;

    /**
     * .what - persist storageState to disk from context
     * .why - save current session (cookies, localStorage) before browser close
     */
    set: () => Promise<void>;
  };
}
