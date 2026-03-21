import { given, then, when } from 'test-fns';

import {
  asStableSnapshot,
  rhxFull,
  stopBrowser,
} from './.test/infra/browser';

describe('browser.describe', () => {
  given('[case1] with active browser', () => {
    const session = 'describe-case1';

    beforeAll(() => {
      stopBrowser(session);
      rhxFull(`rhx browser.start --mode HEADLESS --session ${session}`);
    });

    afterAll(() => {
      stopBrowser(session);
    });

    when('[t0] skill is invoked', () => {
      then('it shows tabs', () => {
        const result = rhxFull(`rhx browser.describe --session ${session}`);

        expect(asStableSnapshot(result.stdout)).toMatchSnapshot('stdout');
        expect(asStableSnapshot(result.stderr)).toMatchSnapshot('stderr');

        expect(result.stdout).toContain('🐢 gnarly');
        expect(result.stdout).toContain('🐚 browser.describe');
        expect(result.stdout).toMatch(/\[\d+\]/); // has tab index
      });
    });
  });

  given('[case2] without browser', () => {
    const session = 'describe-case2';

    beforeAll(() => {
      stopBrowser(session);
    });

    when('[t0] skill is invoked without browser active', () => {
      then('it fails with no browser found error', () => {
        let error: (Error & { stdout?: string; stderr?: string }) | null = null;
        try {
          rhxFull(`rhx browser.describe --session ${session}`);
        } catch (e) {
          error = e as Error & { stdout?: string; stderr?: string };
        }
        expect(error).toBeTruthy();
        expect(asStableSnapshot(error?.stdout || '')).toMatchSnapshot('stdout');
        expect(asStableSnapshot(error?.stderr || '')).toMatchSnapshot('stderr');
        expect(error?.message).toContain('no browser found');
      });
    });
  });

  given('[case3] multiple independent sessions', () => {
    const session1 = 'describe-case3a';
    const session2 = 'describe-case3b';

    beforeAll(() => {
      stopBrowser(session1);
      stopBrowser(session2);
      rhxFull(`rhx browser.start --mode HEADLESS --session ${session1}`);
      rhxFull(`rhx browser.start --mode HEADLESS --session ${session2}`);
    });

    afterAll(() => {
      stopBrowser(session1);
      stopBrowser(session2);
    });

    when('[t0] each session is described', () => {
      then('shows independent tab state', () => {
        const result1 = rhxFull(`rhx browser.describe --session ${session1}`);
        const result2 = rhxFull(`rhx browser.describe --session ${session2}`);

        expect(asStableSnapshot(result1.stdout)).toMatchSnapshot('session1 stdout');
        expect(asStableSnapshot(result1.stderr)).toMatchSnapshot('session1 stderr');
        expect(asStableSnapshot(result2.stdout)).toMatchSnapshot('session2 stdout');
        expect(asStableSnapshot(result2.stderr)).toMatchSnapshot('session2 stderr');

        expect(result1.stdout).toContain('tabs:');
        expect(result2.stdout).toContain('tabs:');
        expect(result1.stdout).toContain(session1);
        expect(result2.stdout).toContain(session2);
      });
    });
  });
});
