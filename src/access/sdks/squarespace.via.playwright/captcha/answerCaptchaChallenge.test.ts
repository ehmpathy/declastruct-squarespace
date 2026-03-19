import { given, then, when } from 'test-fns';

import { answerCaptchaChallenge } from './answerCaptchaChallenge';

/**
 * .what - unit tests for answerCaptchaChallenge
 * .why - verifies tiered captcha answer orchestration
 */
describe('answerCaptchaChallenge', () => {
  const mockLog = {
    warn: jest.fn(),
    info: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  given('a page without captcha', () => {
    const mockPage = {
      locator: () => ({
        count: async () => 0,
      }),
    } as any;

    const mockHandle = {} as any;

    when('answerCaptchaChallenge is called', () => {
      then('returns solved with method none', async () => {
        const result = await answerCaptchaChallenge(
          {
            page: mockPage,
            handle: mockHandle,
            captchaConfig: {},
          },
          { log: mockLog },
        );
        expect(result.solved).toBe(true);
        expect(result.method).toBe('none');
      });
    });
  });

  given('a page with turnstile captcha and checkbox click succeeds', () => {
    let respawnCalls: string[] = [];
    let storageSetCalled = false;

    const mockPage = {
      locator: () => ({
        count: async () => 1, // captcha present
      }),
      url: () => 'https://example.com',
    } as any;

    const mockHeadfulPage = {
      goto: jest.fn(),
      close: jest.fn(),
      frameLocator: () => ({
        locator: () => ({
          click: async () => {},
        }),
      }),
      waitForTimeout: async () => {},
      locator: () => ({
        count: async () => 0, // captcha cleared after click
      }),
    } as any;

    const mockHandle = {
      mode: 'HEADLESS',
      context: {
        newPage: async () => mockHeadfulPage,
      },
      respawn: async (input: { mode: string }) => {
        respawnCalls.push(input.mode);
      },
      storage: {
        set: async () => {
          storageSetCalled = true;
        },
      },
    } as any;

    beforeEach(() => {
      respawnCalls = [];
      storageSetCalled = false;
    });

    when('answerCaptchaChallenge is called', () => {
      then('respawns to headful, clicks checkbox, respawns back', async () => {
        const result = await answerCaptchaChallenge(
          {
            page: mockPage,
            handle: mockHandle,
            captchaConfig: {},
          },
          { log: mockLog },
        );
        expect(result.solved).toBe(true);
        expect(result.method).toBe('checkbox');
        expect(respawnCalls).toEqual(['HEADFUL', 'HEADLESS']);
        expect(storageSetCalled).toBe(true);
      });
    });
  });

  given('a page with captcha and checkbox disabled', () => {
    let waitForHumanCalled = false;

    // mock the waitForHumanSignal to return immediately
    jest.mock('./waitForHumanSignal', () => ({
      waitForHumanSignal: async () => {
        waitForHumanCalled = true;
      },
    }));

    const mockPage = {
      locator: () => ({
        count: async () => 1, // captcha present
      }),
      url: () => 'https://example.com',
    } as any;

    const mockHeadfulPage = {
      goto: jest.fn(),
      close: jest.fn(),
    } as any;

    const mockHandle = {
      mode: 'HEADLESS',
      context: {
        newPage: async () => mockHeadfulPage,
      },
      respawn: jest.fn(),
      storage: {
        set: jest.fn(),
      },
    } as any;

    when('checkbox is disabled and human fallback is disabled', () => {
      then('returns not solved', async () => {
        const result = await answerCaptchaChallenge(
          {
            page: mockPage,
            handle: mockHandle,
            captchaConfig: {
              checkboxClickEnabled: false,
              humanFallbackEnabled: false,
            },
          },
          { log: mockLog },
        );
        expect(result.solved).toBe(false);
        expect(result.method).toBe('none');
      });
    });
  });
});
