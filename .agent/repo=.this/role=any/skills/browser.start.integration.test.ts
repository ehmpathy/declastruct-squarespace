import * as fs from 'fs';

import { given, then, when } from 'test-fns';

import {
  asStableSnapshot,
  getWsEndpointFile,
  rhxFull,
  stopBrowser,
} from './.test/infra/browser';

describe('browser.start', () => {
  given('[case1] --mode HEADLESS', () => {
    const session = 'start-case1';
    const wsEndpointFile = getWsEndpointFile(session);

    beforeAll(() => {
      stopBrowser(session);
    });

    afterAll(() => {
      stopBrowser(session);
    });

    when('[t0] skill is invoked', () => {
      then('it starts browser and writes wsEndpoint file', () => {
        const result = rhxFull(`rhx browser.start --mode HEADLESS --session ${session}`);

        expect(asStableSnapshot(result.stdout)).toMatchSnapshot('stdout');
        expect(asStableSnapshot(result.stderr)).toMatchSnapshot('stderr');

        expect(result.stdout).toContain('🐢 surfs up');
        expect(result.stdout).toContain('🐚 browser.start');
        expect(result.stdout).toContain(`session: ${session}`);
        expect(result.stdout).toContain('mode: HEADLESS');
        expect(result.stdout).toContain('wsEndpoint: ws://');
        expect(fs.existsSync(wsEndpointFile)).toBe(true);
      });
    });
  });

  given('[case2] without --mode', () => {
    when('[t0] skill is invoked without --mode', () => {
      then('it fails with usage message', () => {
        let error: (Error & { stdout?: string; stderr?: string }) | null = null;
        try {
          rhxFull('rhx browser.start');
        } catch (e) {
          error = e as Error & { stdout?: string; stderr?: string };
        }
        expect(error).toBeTruthy();
        expect(asStableSnapshot(error?.stdout || '')).toMatchSnapshot('stdout');
        expect(asStableSnapshot(error?.stderr || '')).toMatchSnapshot('stderr');
        expect(error?.message).toContain('--mode required');
      });
    });
  });

  given('[case3] with invalid --mode', () => {
    when('[t0] skill is invoked with invalid mode', () => {
      then('it fails with error message', () => {
        let error: (Error & { stdout?: string; stderr?: string }) | null = null;
        try {
          rhxFull('rhx browser.start --mode INVALID');
        } catch (e) {
          error = e as Error & { stdout?: string; stderr?: string };
        }
        expect(error).toBeTruthy();
        expect(asStableSnapshot(error?.stdout || '')).toMatchSnapshot('stdout');
        expect(asStableSnapshot(error?.stderr || '')).toMatchSnapshot('stderr');
        expect(error?.message).toContain('must be HEADFUL or HEADLESS');
      });
    });
  });

  given('[case4] --refresh kills extant browser', () => {
    const session = 'start-case4';
    const wsEndpointFile = getWsEndpointFile(session);

    beforeAll(() => {
      stopBrowser(session);
    });

    afterAll(() => {
      stopBrowser(session);
    });

    when('[t0] browser is started then refreshed', () => {
      then('new browser replaces old one', () => {
        rhxFull(`rhx browser.start --mode HEADLESS --session ${session}`);
        const endpoint1 = fs.readFileSync(wsEndpointFile, 'utf-8');

        const result = rhxFull(`rhx browser.start --mode HEADLESS --session ${session} --refresh`);

        expect(asStableSnapshot(result.stdout)).toMatchSnapshot('--refresh stdout');
        expect(asStableSnapshot(result.stderr)).toMatchSnapshot('--refresh stderr');

        expect(result.stdout).toContain('🐢 surfs up');
        expect(result.stdout).toContain('🐚 browser.start');

        const endpoint2 = fs.readFileSync(wsEndpointFile, 'utf-8');
        expect(endpoint2).not.toEqual(endpoint1);
      });
    });
  });
});
