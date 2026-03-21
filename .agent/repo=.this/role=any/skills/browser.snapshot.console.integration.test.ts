import { given, then, when } from 'test-fns';

import {
  asStableSnapshot,
  rhxFull,
  stopBrowser,
} from './.test/infra/browser';

describe('browser.snapshot.console', () => {
  given('[case1] with active browser', () => {
    const session = 'snapshot-console-case1';

    beforeAll(() => {
      stopBrowser(session);
      rhxFull(`rhx browser.start --mode HEADLESS --session ${session}`);
    });

    afterAll(() => {
      stopBrowser(session);
    });

    when('[t0] skill is invoked', () => {
      then('it captures console logs', () => {
        const result = rhxFull(`rhx browser.snapshot.console --tab 0 --session ${session}`);

        expect(asStableSnapshot(result.stdout)).toMatchSnapshot('stdout');
        expect(asStableSnapshot(result.stderr)).toMatchSnapshot('stderr');

        expect(result.stdout).toContain('snapshot.console.json');
      });
    });
  });

  given('[case2] without --tab', () => {
    when('[t0] skill is invoked without --tab', () => {
      then('it fails with usage message', () => {
        let error: (Error & { stdout?: string; stderr?: string }) | null = null;
        try {
          rhxFull('rhx browser.snapshot.console');
        } catch (e) {
          error = e as Error & { stdout?: string; stderr?: string };
        }
        expect(error).toBeTruthy();
        expect(asStableSnapshot(error?.stdout || '')).toMatchSnapshot('stdout');
        expect(asStableSnapshot(error?.stderr || '')).toMatchSnapshot('stderr');
        expect(error?.message).toContain('--tab required');
      });
    });
  });
});
