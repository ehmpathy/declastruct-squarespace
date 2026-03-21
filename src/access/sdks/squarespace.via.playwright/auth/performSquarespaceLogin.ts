import { BadRequestError } from 'helpful-errors';
import type { Page } from 'playwright';

import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { authSelectors } from '../selectors/authSelectors';
import { generateTotpCode } from './generateTotpCode';

/**
 * .what - Perform Squarespace login with credentials and optional 2FA
 * .why - Establishes authenticated session for all subsequent operations
 */
export const performSquarespaceLogin = async (
  page: Page,
  credentials: ContextSquarespaceAgentOptions['credentials'],
): Promise<void> => {
  // navigate to login page
  await page.goto('https://login.squarespace.com/');
  await page.waitForLoadState('networkidle');

  // enter email and password
  await page.fill(authSelectors.loginPage.emailInput, credentials.email);
  await page.fill(authSelectors.loginPage.passwordInput, credentials.password);

  // submit login form
  await page.click(authSelectors.loginPage.submitButton);

  // wait for either logged-in state OR 2FA challenge
  // .note - spa uses hash navigation, so networkidle may fire before render
  const postLoginState = await Promise.race([
    page
      .waitForSelector(authSelectors.loggedIn.accountMenu, { timeout: 15000 })
      .then(() => 'logged-in' as const),
    page
      .waitForSelector(authSelectors.loggedIn.domainsLink, { timeout: 15000 })
      .then(() => 'logged-in' as const),
    page
      .waitForSelector(authSelectors.totpPage.codeInput, { timeout: 15000 })
      .then(() => 'totp-required' as const),
    page
      .waitForSelector(authSelectors.sms2faPage.container, { timeout: 15000 })
      .then(() => 'sms-required' as const),
    page
      .waitForSelector(authSelectors.passkey2faPage.container, {
        timeout: 15000,
      })
      .then(() => 'passkey-required' as const),
    page
      .waitForSelector(authSelectors.loginPage.errorMessage, { timeout: 15000 })
      .then(() => 'error' as const),
  ]);

  // handle unsupported 2FA methods (per blackbox criteria usecase.7)
  if (postLoginState === 'sms-required') {
    throw new BadRequestError('totp required, sms not supported', {
      hint: 'reconfigure squarespace account to use authenticator app instead of sms',
    });
  }
  if (postLoginState === 'passkey-required') {
    throw new BadRequestError('totp required, passkeys not supported', {
      hint: 'reconfigure squarespace account to use authenticator app instead of passkey',
    });
  }

  // handle login error
  if (postLoginState === 'error') {
    const errorText = await page.textContent(
      authSelectors.loginPage.errorMessage,
    );
    throw new BadRequestError('authentication failed', {
      reason: errorText || 'unknown error',
      hint: 'check credentials and try again',
    });
  }

  // handle TOTP 2FA if required
  if (postLoginState === 'totp-required') {
    if (!credentials.totp?.secret) {
      throw new BadRequestError(
        'totp 2fa required but no totp secret provided',
        {
          hint: 'set credentials.totp.secret in provider config',
        },
      );
    }
    const totpCode = generateTotpCode(credentials.totp.secret);
    await page.fill(authSelectors.totpPage.codeInput, totpCode);
    await page.click(authSelectors.totpPage.submitButton);

    // wait for logged-in state after TOTP
    const postTotpState = await Promise.race([
      page
        .waitForSelector(authSelectors.loggedIn.accountMenu, { timeout: 10000 })
        .then(() => 'logged-in' as const),
      page
        .waitForSelector(authSelectors.loggedIn.domainsLink, { timeout: 10000 })
        .then(() => 'logged-in' as const),
      page
        .waitForSelector(authSelectors.totpPage.errorMessage, {
          timeout: 10000,
        })
        .then(() => 'totp-error' as const),
    ]);

    if (postTotpState === 'totp-error') {
      const errorText = await page.textContent(
        authSelectors.totpPage.errorMessage,
      );
      throw new BadRequestError('totp verification failed', {
        reason: errorText || 'invalid code',
        hint: 'check totp secret and try again',
      });
    }
  }

  // at this point we should be logged in
};
