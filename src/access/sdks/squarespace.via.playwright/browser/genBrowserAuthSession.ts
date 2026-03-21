import * as fs from 'fs';
import * as path from 'path';
import type { Browser, BrowserContext } from 'playwright';
import { withSimpleCache } from 'with-simple-cache';

import type {
  BrowserAuthSession,
  BrowserMode,
} from '@src/domain.objects/BrowserAuthSession';
import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { checkSessionHealth } from '../auth/checkSessionHealth';
import { performSquarespaceLogin } from '../auth/performSquarespaceLogin';
import { stealthChromium as chromium } from './stealthChromium';

/**
 * .what - launch or connect to browser with stealth plugin
 * .why - centralized browser launch logic for initial spawn and respawn
 */
const launchBrowser = async (input: {
  mode: BrowserMode;
  wsEndpoint: string | undefined;
}): Promise<{ browser: Browser; extantContext: BrowserContext | null }> => {
  const { mode, wsEndpoint } = input;
  const headless = mode === 'HEADLESS';

  // connect to extant browser if endpoint provided
  // .note - use connectOverCDP() for CDP endpoints (skill uses launch() with --remote-debug-port)
  if (wsEndpoint) {
    console.log(
      'genBrowserAuthSession: connect to extant browser at',
      wsEndpoint,
    );
    const browser = await chromium.connectOverCDP(wsEndpoint);

    // get extant context from skill-opened browser (reuse same window)
    const contexts = browser.contexts();
    const extantContext: BrowserContext | null =
      contexts.length > 0 ? (contexts[0] as BrowserContext) : null;
    if (extantContext) {
      console.log('genBrowserAuthSession: reuse extant context (same window)');
    }

    return { browser, extantContext };
  }

  // launch new browser in requested mode
  console.log('genBrowserAuthSession: launch new browser in', mode, 'mode');
  const browser = await chromium.launch({ headless });
  return { browser, extantContext: null };
};

/**
 * .what - create browser context with optional storageState restore
 * .why - context holds session cookies and localStorage
 */
const createBrowserContext = async (input: {
  browser: Browser;
  storageState: any;
}): Promise<BrowserContext> => {
  const { browser, storageState } = input;

  return browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    storageState,
  });
};

/**
 * .what - read storageState from disk
 * .why - restore session after browser respawn
 * .note - returns any to match playwright storageState option signature
 */
const readStorageState = (input: { path: string | undefined }): any => {
  const { path: statePath } = input;
  if (!statePath || !fs.existsSync(statePath)) return undefined;
  return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
};

/**
 * .what - write storageState to disk
 * .why - persist session before browser close
 */
const writeStorageState = async (input: {
  context: BrowserContext;
  path: string | undefined;
}): Promise<void> => {
  const { context, path: statePath } = input;
  if (!statePath) return;

  const storageState = await context.storageState();
  const dir = path.dirname(statePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(storageState, null, 2));
};

/**
 * .what - create browser session with respawn capability
 * .why - enables mode switch (headless <-> headful) for captcha handle
 * .note - handle is mutable; respawn() updates references in place for all consumers
 */
const createBrowserAuthSession = async (
  agentOptions: ContextSquarespaceAgentOptions,
): Promise<BrowserAuthSession> => {
  const storageStatePath = agentOptions.session?.storageStatePath;
  const wsEndpoint = agentOptions.browser.extantBrowserWSEndpoint;

  // track if connected to skill-started browser (respawn mode-switch restricted)
  const connectedToExtantBrowser = !!wsEndpoint;

  // default to HEADFUL for development; set BROWSER_HEADLESS=true for headless
  const initialMode: BrowserMode =
    process.env.BROWSER_HEADLESS === 'true' ? 'HEADLESS' : 'HEADFUL';

  // read storageState from disk if extant
  const storageStateInitial = readStorageState({ path: storageStatePath });

  // launch browser (may return extant context if connected to CDP browser)
  const { browser: launchedBrowser, extantContext } = await launchBrowser({
    mode: initialMode,
    wsEndpoint,
  });
  let browser = launchedBrowser;

  // reuse extant context from skill-opened browser, or create new one
  let context =
    extantContext ??
    (await createBrowserContext({
      browser,
      storageState: storageStateInitial,
    }));
  let mode: BrowserMode = initialMode;

  // check session health and login if needed
  const testPage = await context.newPage();
  const sessionStatus = await checkSessionHealth(testPage);

  if (!sessionStatus.valid) {
    await performSquarespaceLogin(testPage, agentOptions.credentials);
    await writeStorageState({ context, path: storageStatePath });
  }

  await testPage.close();

  // create mutable handle that supports respawn
  const handle: BrowserAuthSession = {
    get browser() {
      return browser;
    },
    get context() {
      return context;
    },
    get mode() {
      return mode;
    },

    close: async () => {
      await context.close();
      await browser.close();
    },

    storage: {
      get: async () => {
        // restore storageState from disk into current context
        // .note - this re-creates the context with fresh storageState
        const storageState = readStorageState({ path: storageStatePath });
        if (!storageState) return;

        await context.close();
        context = await createBrowserContext({ browser, storageState });
      },

      set: async () => {
        await writeStorageState({ context, path: storageStatePath });
      },
    },

    respawn: async (input: { mode: BrowserMode }) => {
      const targetMode = input.mode;

      // refuse mode change when connected to skill-started browser
      // .why - skill browser is persistent; respawn would orphan it and spawn new browser
      if (connectedToExtantBrowser && targetMode !== mode) {
        throw new Error(
          `respawn mode change refused: connected to skill-started browser in ${mode} mode. ` +
            `use 'rhx browser.start --mode ${targetMode} --refresh' to restart browser in ${targetMode} mode.`,
        );
      }

      // save current session before close
      await handle.storage.set();

      // close current browser
      await context.close();
      await browser.close();

      // launch new browser in target mode
      // .note - wsEndpoint not used for respawn; we need fresh browser with new mode
      const { browser: newBrowser } = await launchBrowser({
        mode: targetMode,
        wsEndpoint: undefined,
      });
      browser = newBrowser;

      // restore session into new context
      const storageState = readStorageState({ path: storageStatePath });
      context = await createBrowserContext({ browser, storageState });

      // update mode
      mode = targetMode;
    },
  };

  return handle;
};

/**
 * .what - get or create browser auth session
 * .why - cache session to avoid repeated login overhead
 * .note - returned handle is shared; respawn() affects all consumers
 */
export const genBrowserAuthSession = async (
  agentOptions: ContextSquarespaceAgentOptions,
): Promise<BrowserAuthSession> => {
  const createWithCache = withSimpleCache(createBrowserAuthSession, {
    cache: agentOptions.browser.cache,
    serialize: {
      key: (opts) => [opts.account.id, opts.credentials.email].join('.'),
    },
  });

  return createWithCache(agentOptions);
};
