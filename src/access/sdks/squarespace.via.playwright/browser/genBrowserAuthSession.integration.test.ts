import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceContext,
  requireSquarespaceCredentials,
} from '../../../../.test/getSampleSquarespaceContext';
import { genBrowserAuthSession } from './genBrowserAuthSession';

/**
 * .what = integration tests for genBrowserAuthSession
 * .why = validates browser auth session with respawn capability
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 */
describe('genBrowserAuthSession', () => {
  requireSquarespaceCredentials();

  given('valid credentials', () => {
    const scene = useBeforeAll(async () => {
      const context = getSampleSquarespaceContext();
      const session = await genBrowserAuthSession(context.agentOptions);
      return { context, session };
    });

    afterAll(async () => {
      await scene.session.close().catch(() => {});
    });

    when('session is created', () => {
      then('has browser instance', () => {
        expect(scene.session.browser).toBeDefined();
      });

      then('has browser context', () => {
        expect(scene.session.context).toBeDefined();
      });

      then('starts in headless mode', () => {
        expect(scene.session.mode).toBe('HEADLESS');
      });

      then('has storage operations', () => {
        expect(scene.session.storage.get).toBeInstanceOf(Function);
        expect(scene.session.storage.set).toBeInstanceOf(Function);
      });

      then('has respawn capability', () => {
        expect(scene.session.respawn).toBeInstanceOf(Function);
      });
    });

    when('stealth plugin is active', () => {
      then('navigator.webdriver is false', async () => {
        const page = await scene.session.context.newPage();
        const webdriver = await page.evaluate(() => navigator.webdriver);
        await page.close();
        expect(webdriver).toBe(false);
      });
    });
  });
});
