import * as fs from 'fs';

import { given, then, when } from 'test-fns';

import {
  asStableSnapshot,
  getWsEndpointFile,
  rhxFull,
  stopBrowser,
} from './.test/infra/browser';

describe('browser.stop', () => {
  given('[case1] with active browser', () => {
    const session = 'stop-case1';
    const wsEndpointFile = getWsEndpointFile(session);

    beforeAll(() => {
      stopBrowser(session);
      rhxFull(`rhx browser.start --mode HEADLESS --session ${session}`);
    });

    afterAll(() => {
      stopBrowser(session);
    });

    when('[t0] skill is invoked', () => {
      then('it stops browser and removes state file', () => {
        const result = rhxFull(`rhx browser.stop --session ${session}`);

        expect(asStableSnapshot(result.stdout)).toMatchSnapshot('stdout');
        expect(asStableSnapshot(result.stderr)).toMatchSnapshot('stderr');

        expect(result.stdout).toContain('🐢 later dude');
        expect(result.stdout).toContain('🐚 browser.stop');
        expect(result.stdout).toContain('browser: stopped');
        expect(fs.existsSync(wsEndpointFile)).toBe(false);
      });
    });
  });

  given('[case2] without browser (idempotent)', () => {
    const session = 'stop-case2';

    beforeAll(() => {
      stopBrowser(session);
    });

    when('[t0] skill is invoked without browser active', () => {
      then('it succeeds with no-op message', () => {
        const result = rhxFull(`rhx browser.stop --session ${session}`);

        expect(asStableSnapshot(result.stdout)).toMatchSnapshot('no-op stdout');
        expect(asStableSnapshot(result.stderr)).toMatchSnapshot('no-op stderr');

        expect(result.stdout).toContain('🐢 later dude');
        expect(result.stdout).toContain('no browser');
      });
    });
  });
});
