import type { Page } from 'playwright';

import { authSelectors } from '../selectors/authSelectors';

/**
 * .what - Verify the Squarespace session is still valid
 * .why - Sessions may expire in long batches (3+ hours for 300 domains)
 *
 * .how - Navigate to account page and check for login redirect
 *        If redirected to login, session has expired
 */
export const checkSessionHealth = async (
  page: Page,
): Promise<{ valid: boolean; reason: string | null }> => {
  // check if already on an authenticated squarespace page
  // .note = skip goto to preserve page state (eventual consistency workaround)
  const currentUrl = page.url();
  const isOnAuthenticatedPage =
    currentUrl.includes('account.squarespace.com') &&
    !currentUrl.includes('/login') &&
    !currentUrl.includes('/signin');

  if (isOnAuthenticatedPage) {
    // already on authenticated page - check for login indicators without goto
    const loginForm = await page.$(authSelectors.loginPage.emailInput);
    if (loginForm) {
      return {
        valid: false,
        reason: 'session expired: login form detected on current page',
      };
    }
    return { valid: true, reason: null };
  }

  // navigate to a lightweight account page to verify session
  const testUrl = 'https://account.squarespace.com/domains';

  try {
    await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });

    // Check current URL - login redirect indicates session expired
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
      return { valid: false, reason: 'session expired: redirected to login' };
    }

    // Check for login form elements (backup detection)
    const loginForm = await page.$(authSelectors.loginPage.emailInput);
    if (loginForm) {
      return {
        valid: false,
        reason: 'session expired: login form detected',
      };
    }

    // Check for logged-in indicator
    const accountMenu = await page.$(authSelectors.loggedIn.accountMenu);
    const domainsLink = await page.$(authSelectors.loggedIn.domainsLink);

    if (accountMenu || domainsLink) {
      return { valid: true, reason: null };
    }

    // No clear indicators - assume valid
    return { valid: true, reason: null };
  } catch (error) {
    // Navigation failure might indicate session issues
    if (error instanceof Error) {
      return {
        valid: false,
        reason: `session health check failed: ${error.message}`,
      };
    }
    return { valid: false, reason: 'session health check failed: unknown' };
  }
};

/**
 * .what - Error thrown when session has expired
 * .why - Enables specific handle for session expiry vs other errors
 */
export class SessionExpiredError extends Error {
  constructor(reason: string) {
    super(`session expired: ${reason}`);
    this.name = 'SessionExpiredError';
  }
}
