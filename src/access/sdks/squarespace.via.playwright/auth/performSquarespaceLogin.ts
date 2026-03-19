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
  await page.waitForLoadState('networkidle');

  // check for unsupported 2FA methods first (per blackbox criteria usecase.7)
  const sms2faContainer = await page.$(authSelectors.sms2faPage.container);
  if (sms2faContainer) {
    throw new BadRequestError('totp required, sms not supported', {
      hint: 'reconfigure squarespace account to use authenticator app instead of sms',
    });
  }

  const passkey2faContainer = await page.$(
    authSelectors.passkey2faPage.container,
  );
  if (passkey2faContainer) {
    throw new BadRequestError('totp required, passkeys not supported', {
      hint: 'reconfigure squarespace account to use authenticator app instead of passkey',
    });
  }

  // check if TOTP 2FA is required
  const totpInput = await page.$(authSelectors.totpPage.codeInput);
  if (totpInput) {
    // generate and enter TOTP code
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
    await page.waitForLoadState('networkidle');
  }

  // verify login succeeded by checking for logged-in indicators
  const isLoggedIn = await Promise.race([
    page
      .waitForSelector(authSelectors.loggedIn.accountMenu, { timeout: 10000 })
      .then(() => true),
    page
      .waitForSelector(authSelectors.loggedIn.domainsLink, { timeout: 10000 })
      .then(() => true),
    page
      .waitForSelector(authSelectors.loginPage.errorMessage, { timeout: 10000 })
      .then(() => false),
  ]);

  if (!isLoggedIn) {
    const errorText = await page.textContent(
      authSelectors.loginPage.errorMessage,
    );
    throw new BadRequestError('authentication failed', {
      reason: errorText || 'unknown error',
      hint: 'check credentials and try again',
    });
  }
};
