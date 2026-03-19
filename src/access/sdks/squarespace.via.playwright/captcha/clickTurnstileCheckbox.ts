import type { Page } from 'playwright';

import { CAPTCHA_SELECTORS } from '../selectors/captchaSelectors';

/**
 * .what - click turnstile checkbox on page (already headful)
 * .why - checkbox click works in headed mode; page comes from handle after respawn
 * .note - does NOT spawn browser; caller uses handle.respawn() first
 */
export const clickTurnstileCheckbox = async (input: {
  page: Page;
  timeoutMs?: number;
}): Promise<{ solved: boolean }> => {
  const { page, timeoutMs = 5000 } = input;

  try {
    // find and click the turnstile checkbox
    const checkboxFrame = page.frameLocator(CAPTCHA_SELECTORS.turnstileIframe);
    await checkboxFrame.locator(CAPTCHA_SELECTORS.turnstileCheckbox).click();

    // wait for validation
    await page.waitForTimeout(timeoutMs);

    // check if solved (challenge iframe disappears)
    const challengeGone =
      (await page.locator(CAPTCHA_SELECTORS.turnstileIframe).count()) === 0;

    return { solved: challengeGone };
  } catch {
    return { solved: false };
  }
};
