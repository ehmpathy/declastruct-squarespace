import { type Browser, type BrowserContext, chromium } from 'playwright';
import { withSimpleCache } from 'with-simple-cache';

import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { performSquarespaceLogin } from '../auth/performSquarespaceLogin';

/**
 * .what - Browser instance with logged-in context
 * .why - Encapsulates browser resources for reuse and cleanup
 */
export interface LoggedInBrowser {
  browser: Browser;
  context: BrowserContext;
  close: () => Promise<void>;
}

/**
 * .what - Create a new browser and perform login
 * .why - Establishes authenticated session for Squarespace operations
 */
const createBrowserAndLogin = async (
  agentOptions: ContextSquarespaceAgentOptions,
): Promise<LoggedInBrowser> => {
  // Connect to existing or launch new browser
  const browser = agentOptions.browser.existingBrowserWSEndpoint
    ? await chromium.connectOverCDP(
        agentOptions.browser.existingBrowserWSEndpoint,
      )
    : await chromium.launch({ headless: true });

  // Create browser context
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  });

  // Perform login
  const loginPage = await context.newPage();
  await performSquarespaceLogin(loginPage, agentOptions.credentials);
  await loginPage.close();

  return {
    browser,
    context,
    close: async () => {
      await context.close();
      await browser.close();
    },
  };
};

/**
 * .what - Get or create a logged-in browser instance
 * .why - Caches browser instance to avoid repeated login overhead
 */
export const findOrCreateLoggedInBrowser = async (
  agentOptions: ContextSquarespaceAgentOptions,
): Promise<LoggedInBrowser> => {
  const createWithCache = withSimpleCache(createBrowserAndLogin, {
    cache: agentOptions.browser.cache,
    serialize: {
      key: (opts) => [opts.account.id, opts.credentials.email].join('.'),
    },
  });

  return createWithCache(agentOptions);
};
