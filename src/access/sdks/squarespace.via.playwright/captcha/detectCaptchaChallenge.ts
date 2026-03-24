import type { Page } from 'playwright';

import { CAPTCHA_SELECTORS } from '../selectors/captchaSelectors';

/**
 * .what - detect captcha challenge on page
 * .why - enables tiered captcha handle: checkbox click → human fallback
 */
export const detectCaptchaChallenge = async (input: {
  page: Page;
}): Promise<{ detected: boolean; type: 'turnstile' | 'challenge' | null }> => {
  const { page } = input;

  // check for cloudflare turnstile iframe
  const turnstileCount = await page
    .locator(CAPTCHA_SELECTORS.turnstileIframe)
    .count()
    .catch(() => 0);
  if (turnstileCount > 0) return { detected: true, type: 'turnstile' };

  // check for challenge page (full-page block)
  const challengeCount = await page
    .locator(CAPTCHA_SELECTORS.challengePage)
    .count()
    .catch(() => 0);
  if (challengeCount > 0) return { detected: true, type: 'challenge' };

  return { detected: false, type: null };
};
