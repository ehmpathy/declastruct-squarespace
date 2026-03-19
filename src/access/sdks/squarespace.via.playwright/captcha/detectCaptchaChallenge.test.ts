import { given, then, when } from 'test-fns';

import { detectCaptchaChallenge } from './detectCaptchaChallenge';

/**
 * .what - unit tests for detectCaptchaChallenge
 * .why - verifies captcha detection logic with mock page fixtures
 */
describe('detectCaptchaChallenge', () => {
  given('a page with turnstile iframe', () => {
    const mockPage = {
      locator: (selector: string) => ({
        count: async () => {
          if (selector.includes('challenges.cloudflare.com')) return 1;
          return 0;
        },
      }),
    } as any;

    when('detection is run', () => {
      then('returns detected with type turnstile', async () => {
        const result = await detectCaptchaChallenge({ page: mockPage });
        expect(result.detected).toBe(true);
        expect(result.type).toBe('turnstile');
      });
    });
  });

  given('a page with challenge div', () => {
    const mockPage = {
      locator: (selector: string) => ({
        count: async () => {
          // only match the challenge page selector, not turnstile iframe
          if (selector.includes('div[class*="challenge"]')) return 1;
          return 0;
        },
      }),
    } as any;

    when('detection is run', () => {
      then('returns detected with type challenge', async () => {
        const result = await detectCaptchaChallenge({ page: mockPage });
        expect(result.detected).toBe(true);
        expect(result.type).toBe('challenge');
      });
    });
  });

  given('a page without captcha', () => {
    const mockPage = {
      locator: () => ({
        count: async () => 0,
      }),
    } as any;

    when('detection is run', () => {
      then('returns not detected', async () => {
        const result = await detectCaptchaChallenge({ page: mockPage });
        expect(result.detected).toBe(false);
        expect(result.type).toBeNull();
      });
    });
  });

  given('a page where locator throws error', () => {
    const mockPage = {
      locator: () => ({
        count: async () => {
          throw new Error('page closed');
        },
      }),
    } as any;

    when('detection is run', () => {
      then('returns not detected (graceful fallback)', async () => {
        const result = await detectCaptchaChallenge({ page: mockPage });
        expect(result.detected).toBe(false);
        expect(result.type).toBeNull();
      });
    });
  });
});
