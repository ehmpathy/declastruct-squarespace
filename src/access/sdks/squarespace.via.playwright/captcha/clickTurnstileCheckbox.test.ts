import { given, then, when } from 'test-fns';

import { clickTurnstileCheckbox } from './clickTurnstileCheckbox';

/**
 * .what - unit tests for clickTurnstileCheckbox
 * .why - verifies checkbox click logic with mock page fixtures
 * .note - integration tests with real captcha in clickTurnstileCheckbox.integration.test.ts
 */
describe('clickTurnstileCheckbox', () => {
  given('a page where checkbox click succeeds and captcha clears', () => {
    let clickCalled = false;
    const mockPage = {
      frameLocator: () => ({
        locator: () => ({
          click: async () => {
            clickCalled = true;
          },
        }),
      }),
      waitForTimeout: async () => {},
      locator: () => ({
        count: async () => 0, // captcha cleared
      }),
    } as any;

    when('clickTurnstileCheckbox is called', () => {
      then('returns solved true', async () => {
        const result = await clickTurnstileCheckbox({ page: mockPage });
        expect(result.solved).toBe(true);
        expect(clickCalled).toBe(true);
      });
    });
  });

  given('a page where checkbox click succeeds but captcha remains', () => {
    const mockPage = {
      frameLocator: () => ({
        locator: () => ({
          click: async () => {},
        }),
      }),
      waitForTimeout: async () => {},
      locator: () => ({
        count: async () => 1, // captcha still present
      }),
    } as any;

    when('clickTurnstileCheckbox is called', () => {
      then('returns solved false', async () => {
        const result = await clickTurnstileCheckbox({ page: mockPage });
        expect(result.solved).toBe(false);
      });
    });
  });

  given('a page where checkbox click throws error', () => {
    const mockPage = {
      frameLocator: () => ({
        locator: () => ({
          click: async () => {
            throw new Error('element not found');
          },
        }),
      }),
    } as any;

    when('clickTurnstileCheckbox is called', () => {
      then('returns solved false (graceful fallback)', async () => {
        const result = await clickTurnstileCheckbox({ page: mockPage });
        expect(result.solved).toBe(false);
      });
    });
  });
});
