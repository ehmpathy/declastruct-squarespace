import type { Page } from 'playwright';

import { emitBrowserMovieFrame } from '@src/_topublish/kermet/emitBrowserMovieFrame';
import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { authSelectors } from '../selectors/authSelectors';
import { generateTotpCode } from './generateTotpCode';

/**
 * .what - Detect and handle reauthentication modal if present
 * .why - Squarespace may prompt for password or TOTP on sensitive operations
 * .note - Reauth may appear in an iframe or directly on page
 * .note - Waits briefly for modal to appear (modal takes time to render after action)
 */
export const handleReauthentication = async (
  page: Page,
  credentials: ContextSquarespaceAgentOptions['credentials'],
): Promise<boolean> => {
  const iframeSelector = authSelectors.reauthModal.iframe;

  // wait for modal to potentially appear (modal takes time to render after action)
  try {
    await page.waitForSelector(iframeSelector, { timeout: 3000 });
    await emitBrowserMovieFrame({
      page,
      frame: { name: 'reauth-modal-appeared' },
    });
  } catch {
    // modal didn't appear within 3s, check if it's present anyway
    const iframeElement = await page.$(iframeSelector);
    if (!iframeElement) {
      // no modal, check fallback selectors on page
      await emitBrowserMovieFrame({
        page,
        frame: { name: 'reauth-no-iframe' },
      });
      // continue to fallback check below (after the if block)
    }
  }

  // check if reauth iframe is present
  const iframeElement = await page.$(iframeSelector);
  await emitBrowserMovieFrame({
    page,
    frame: { name: `reauth-check-iframe-${iframeElement ? 'found' : 'none'}` },
  });

  if (iframeElement) {
    // iframe is present - wait for its content to load
    // .note - iframe content takes time to load, need to wait
    await page.waitForTimeout(2000);
    await emitBrowserMovieFrame({
      page,
      frame: { name: 'reauth-iframe-loaded' },
    });

    const reauthIframe = page.frameLocator(iframeSelector);

    // wait for the input to appear inside the iframe
    // .note - fail-fast if iframe content does not render the expected inputs
    await reauthIframe
      .locator(
        `${authSelectors.reauthModal.totpInput}, ${authSelectors.reauthModal.passwordInput}`,
      )
      .first()
      .waitFor({ timeout: 10000 });
    await emitBrowserMovieFrame({
      page,
      frame: { name: 'reauth-inputs-visible' },
    });

    // try TOTP input in iframe first (most common for reauth)
    const totpInputInIframe = reauthIframe.locator(
      authSelectors.reauthModal.totpInput,
    );
    const totpCount = await totpInputInIframe.count();
    await emitBrowserMovieFrame({
      page,
      frame: { name: `reauth-totp-count-${totpCount}` },
    });

    if (totpCount > 0) {
      // generate and fill TOTP code
      if (!credentials.totp?.secret)
        throw new Error('TOTP secret required for reauthentication');
      const totpCode = generateTotpCode(credentials.totp.secret);
      await totpInputInIframe.first().fill(totpCode);

      // verify fill succeeded
      // .note - input may auto-format with spaces (e.g., "554 541" instead of "554541")
      const filledValue = await totpInputInIframe.first().inputValue();
      const normalizedFilled = filledValue.replace(/\s/g, '');
      if (normalizedFilled !== totpCode) {
        throw new Error(
          `handleReauthentication: TOTP fill failed. expected=${totpCode}, got=${filledValue}`,
        );
      }
      await emitBrowserMovieFrame({
        page,
        frame: { name: 'reauth-totp-filled' },
      });
      // .note - use evaluate to dispatch click event directly (bypasses all viewport checks)
      // .note - required because iframe may be offset such that button is outside page viewport
      const totpSubmitButton = reauthIframe.locator(
        authSelectors.reauthModal.submitButton,
      );
      await totpSubmitButton.evaluate((el) =>
        (el as HTMLButtonElement).click(),
      );
      await emitBrowserMovieFrame({
        page,
        frame: { name: 'reauth-totp-submitted' },
      });

      // wait for modal to dismiss
      await page.waitForSelector(iframeSelector, {
        state: 'hidden',
        timeout: 10000,
      });
      await emitBrowserMovieFrame({
        page,
        frame: { name: 'reauth-modal-dismissed' },
      });

      // verify modal is gone (fail-fast if still present)
      const modalStillPresent = await page.$(iframeSelector);
      if (modalStillPresent) {
        throw new Error(
          `handleReauthentication: TOTP submitted but modal still present. url=${page.url()}`,
        );
      }
      return true;
    }

    // try password input in iframe
    const passwordInputInIframe = reauthIframe.locator(
      authSelectors.reauthModal.passwordInput,
    );
    const passwordCount = await passwordInputInIframe.count();
    await emitBrowserMovieFrame({
      page,
      frame: { name: `reauth-password-count-${passwordCount}` },
    });

    if (passwordCount > 0) {
      await passwordInputInIframe.first().fill(credentials.password);

      // verify fill succeeded
      const filledValue = await passwordInputInIframe.first().inputValue();
      if (filledValue !== credentials.password) {
        throw new Error(
          `handleReauthentication: password fill failed. expected length=${credentials.password.length}, got length=${filledValue.length}`,
        );
      }
      await emitBrowserMovieFrame({
        page,
        frame: { name: 'reauth-password-filled' },
      });
      // .note - use evaluate to dispatch click event directly (bypasses all viewport checks)
      // .note - required because iframe may be offset such that button is outside page viewport
      const passwordSubmitButton = reauthIframe.locator(
        authSelectors.reauthModal.submitButton,
      );
      await passwordSubmitButton.evaluate((el) =>
        (el as HTMLButtonElement).click(),
      );
      await emitBrowserMovieFrame({
        page,
        frame: { name: 'reauth-password-submitted' },
      });

      // wait for modal to dismiss
      await page.waitForSelector(iframeSelector, {
        state: 'hidden',
        timeout: 10000,
      });
      await emitBrowserMovieFrame({
        page,
        frame: { name: 'reauth-modal-dismissed' },
      });

      // verify modal is gone (fail-fast if still present)
      const modalStillPresent2 = await page.$(iframeSelector);
      if (modalStillPresent2) {
        throw new Error(
          `handleReauthentication: password submitted but modal still present. url=${page.url()}`,
        );
      }
      return true;
    }

    // fail-fast: iframe found but no inputs matched
    throw new Error(
      `handleReauthentication: iframe found but no TOTP or password inputs. ` +
        `totpCount=${totpCount}, passwordCount=${passwordCount}, url=${page.url()}`,
    );
  }

  // fallback: try on page directly (non-iframe modal)
  await emitBrowserMovieFrame({
    page,
    frame: { name: 'reauth-fallback-check' },
  });
  const totpInput = await page.$(authSelectors.reauthModal.totpInput);
  if (totpInput && (await totpInput.isVisible())) {
    if (!credentials.totp?.secret)
      throw new Error('TOTP secret required for reauthentication');
    const totpCode = generateTotpCode(credentials.totp.secret);
    await page.fill(authSelectors.reauthModal.totpInput, totpCode);

    // verify fill succeeded
    const filledValue = await page.inputValue(
      authSelectors.reauthModal.totpInput,
    );
    if (filledValue !== totpCode) {
      throw new Error(
        `handleReauthentication: fallback TOTP fill failed. expected=${totpCode}, got=${filledValue}`,
      );
    }
    await emitBrowserMovieFrame({
      page,
      frame: { name: 'reauth-fallback-totp-filled' },
    });
    // .note - use force:true to bypass overlay element that may intercept pointer events
    await page.click(authSelectors.reauthModal.submitButton, { force: true });
    await page.waitForSelector(authSelectors.reauthModal.container, {
      state: 'hidden',
      timeout: 10000,
    });
    await emitBrowserMovieFrame({
      page,
      frame: { name: 'reauth-fallback-totp-done' },
    });
    return true;
  }

  const passwordInput = await page.$(authSelectors.reauthModal.passwordInput);
  if (passwordInput && (await passwordInput.isVisible())) {
    await page.fill(
      authSelectors.reauthModal.passwordInput,
      credentials.password,
    );

    // verify fill succeeded
    const filledValue = await page.inputValue(
      authSelectors.reauthModal.passwordInput,
    );
    if (filledValue !== credentials.password) {
      throw new Error(
        `handleReauthentication: fallback password fill failed. expected length=${credentials.password.length}, got length=${filledValue.length}`,
      );
    }
    await emitBrowserMovieFrame({
      page,
      frame: { name: 'reauth-fallback-password-filled' },
    });
    // .note - use force:true to bypass overlay element that may intercept pointer events
    await page.click(authSelectors.reauthModal.submitButton, { force: true });
    await page.waitForLoadState('load');
    await page.waitForSelector(authSelectors.reauthModal.container, {
      state: 'hidden',
      timeout: 5000,
    });
    await emitBrowserMovieFrame({
      page,
      frame: { name: 'reauth-fallback-password-done' },
    });
    return true;
  }

  // no reauth modal detected
  await emitBrowserMovieFrame({ page, frame: { name: 'reauth-none-needed' } });
  return false;
};

/**
 * .what - Check if reauthentication is required on current page
 * .why - Enables proactive detection before attempting sensitive actions
 */
export const isReauthenticationRequired = async (
  page: Page,
): Promise<boolean> => {
  const reauthModal = await page.$(authSelectors.reauthModal.container);
  return reauthModal !== null;
};
