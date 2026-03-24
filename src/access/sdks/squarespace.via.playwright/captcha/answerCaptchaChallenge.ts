import type { Page } from 'playwright';

import type { BrowserAuthSession } from '@src/domain.objects/BrowserAuthSession';
import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { clickTurnstileCheckbox } from './clickTurnstileCheckbox';
import { detectCaptchaChallenge } from './detectCaptchaChallenge';
import { waitForHumanSignal } from './waitForHumanSignal';

/**
 * .what - answer captcha challenge via shared browser respawn
 * .why - tiered approach: checkbox click (auto) → human fallback
 */
export const answerCaptchaChallenge = async (
  input: {
    page: Page;
    handle: BrowserAuthSession;
    captchaConfig: NonNullable<ContextSquarespaceAgentOptions['captcha']>;
  },
  context: {
    log: {
      warn: (msg: string, meta?: object) => void;
      info: (msg: string, meta?: object) => void;
    };
  },
): Promise<{ solved: boolean; method: 'none' | 'checkbox' | 'human' }> => {
  const { page, handle, captchaConfig } = input;

  // detect captcha
  const detection = await detectCaptchaChallenge({ page });
  if (!detection.detected) return { solved: true, method: 'none' };

  context.log.warn('captcha detected', { type: detection.type });

  // tier 2: headful checkbox click (if enabled)
  if (captchaConfig.checkboxClickEnabled !== false) {
    // respawn shared browser in headful mode
    await handle.respawn({ mode: 'HEADFUL' });

    // get fresh page from new context
    const headfulPage = await handle.context.newPage();
    await headfulPage.goto(page.url());

    // click the checkbox
    const clickResult = await clickTurnstileCheckbox({
      page: headfulPage,
      timeoutMs: captchaConfig.checkboxTimeoutMs ?? 5000,
    });

    if (clickResult.solved) {
      context.log.info('captcha solved via checkbox click');
      // capture solved session before respawn
      await handle.storage.set();
      // respawn back to headless
      await handle.respawn({ mode: 'HEADLESS' });
      await headfulPage.close();
      return { solved: true, method: 'checkbox' };
    }

    // checkbox failed (puzzle required) → proceed to tier 3
    context.log.warn('checkbox click failed, puzzle detected');
    await headfulPage.close();
  }

  // tier 3: human fallback (if enabled)
  if (captchaConfig.humanFallbackEnabled !== false) {
    // already in headful mode from tier 2, or respawn now
    if (handle.mode !== 'HEADFUL') {
      await handle.respawn({ mode: 'HEADFUL' });
    }

    // get fresh page from headful context
    const headfulPage = await handle.context.newPage();
    await headfulPage.goto(page.url());

    // prompt human to solve
    await waitForHumanSignal({
      signalMode: captchaConfig.humanSignalMode ?? 'stdin',
      signalFilePath: captchaConfig.humanSignalFilePath,
    });

    context.log.info('captcha solved by human');
    // capture solved session before respawn
    await handle.storage.set();
    // respawn back to headless
    await handle.respawn({ mode: 'HEADLESS' });
    await headfulPage.close();
    return { solved: true, method: 'human' };
  }

  return { solved: false, method: 'none' };
};
