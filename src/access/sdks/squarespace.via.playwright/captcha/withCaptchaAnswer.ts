import type { Page } from 'playwright';

import type { BrowserAuthSession } from '@src/domain.objects/BrowserAuthSession';
import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { answerCaptchaChallenge } from './answerCaptchaChallenge';

/**
 * .what - wrapper for scraper operations with captcha answer
 * .why - detect captcha after navigation, answer via respawn, retry operation
 */
export const withCaptchaAnswer = <T>(
  operation: (page: Page) => Promise<T>,
  options: {
    handle: BrowserAuthSession;
    captchaConfig: ContextSquarespaceAgentOptions['captcha'];
    log: {
      warn: (msg: string, meta?: object) => void;
      info: (msg: string, meta?: object) => void;
    };
  },
): ((page: Page) => Promise<T>) => {
  return async (page: Page): Promise<T> => {
    const { handle, captchaConfig, log } = options;

    // attempt operation
    try {
      return await operation(page);
    } catch (error) {
      // check if captcha blocks the operation
      if (!captchaConfig) throw error;

      const captchaResult = await answerCaptchaChallenge(
        {
          page,
          handle,
          captchaConfig,
        },
        { log },
      );

      // if no captcha detected, rethrow original error
      if (captchaResult.method === 'none' && !captchaResult.solved) {
        throw error;
      }

      // if captcha was solved, retry operation with fresh page
      if (captchaResult.solved) {
        const freshPage = await handle.context.newPage();
        await freshPage.goto(page.url());
        try {
          return await operation(freshPage);
        } finally {
          await freshPage.close();
        }
      }

      throw error;
    }
  };
};
