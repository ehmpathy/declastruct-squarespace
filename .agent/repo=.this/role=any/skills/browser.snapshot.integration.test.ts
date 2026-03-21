import * as fs from 'fs';

import { given, then, when } from 'test-fns';

import {
  asStableSnapshot,
  rhxFull,
  stopBrowser,
} from './.test/infra/browser';

describe('browser.snapshot', () => {
  given('[case1] --tab 0 captures all assets', () => {
    const session = 'snapshot-case1';

    beforeAll(() => {
      stopBrowser(session);
      rhxFull(`rhx browser.start --mode HEADLESS --session ${session}`);
    });

    afterAll(() => {
      stopBrowser(session);
    });

    when('[t0] skill is invoked', () => {
      then('it captures all assets', () => {
        const result = rhxFull(`rhx browser.snapshot --tab 0 --session ${session}`);

        expect(asStableSnapshot(result.stdout)).toMatchSnapshot('stdout');
        expect(asStableSnapshot(result.stderr)).toMatchSnapshot('stderr');

        expect(result.stdout).toContain('🐢 sweet');
        expect(result.stdout).toContain('🐚 browser.snapshot');
        expect(result.stdout).toContain('snapshot.meta.json');
        expect(result.stdout).toContain('snapshot.png');
        expect(result.stdout).toContain('snapshot.html');
        expect(result.stdout).toContain('snapshot.console.json');
        expect(result.stdout).toContain('snapshot.storage.json');

        // verify output directory created with files
        const match = result.stdout.match(/\.temp\/\.cache\/browser\.[\w-]+\/snapshot\.[^/\s]+/);
        expect(match).toBeTruthy();
        if (match) {
          const files = fs.readdirSync(match[0]);
          expect(files).toContain('snapshot.meta.json');
          expect(files).toContain('snapshot.png');
          expect(files).toContain('snapshot.html');
        }
      });
    });
  });

  given('[case2] without --tab', () => {
    when('[t0] skill is invoked without --tab', () => {
      then('it fails with usage message', () => {
        let error: (Error & { stdout?: string; stderr?: string }) | null = null;
        try {
          rhxFull('rhx browser.snapshot');
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

  given('[case3] tab out of range', () => {
    const session = 'snapshot-case3';

    beforeAll(() => {
      stopBrowser(session);
      rhxFull(`rhx browser.start --mode HEADLESS --session ${session}`);
    });

    afterAll(() => {
      stopBrowser(session);
    });

    when('[t0] skill is invoked with --tab 99', () => {
      then('it fails with tab not found message', () => {
        let error: (Error & { stdout?: string; stderr?: string }) | null = null;
        try {
          rhxFull(`rhx browser.snapshot --tab 99 --session ${session}`);
        } catch (e) {
          error = e as Error & { stdout?: string; stderr?: string };
        }
        expect(error).toBeTruthy();
        expect(asStableSnapshot(error?.stdout || '')).toMatchSnapshot('stdout');
        expect(asStableSnapshot(error?.stderr || '')).toMatchSnapshot('stderr');
        expect(error?.message).toContain('tab 99 not found');
      });
    });
  });

  given('[case4] no browser active', () => {
    const session = 'snapshot-case4-no-browser';

    beforeAll(() => {
      // ensure no browser is active for this session
      stopBrowser(session);
    });

    when('[t0] skill is invoked without browser', () => {
      then('it fails with no browser found message', () => {
        let error: (Error & { stdout?: string; stderr?: string }) | null = null;
        try {
          rhxFull(`rhx browser.snapshot --tab 0 --session ${session}`);
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

  given('[case5] dispatcher runs subcommands in isolation', () => {
    const session = 'snapshot-case5-isolation';
    // call dispatcher directly to test subcommand routing
    // (bypasses rhx to verify dispatcher logic in isolation)
    const dispatcherPath = '.agent/repo=.this/role=any/skills/browser.snapshot.sh';

    beforeAll(() => {
      stopBrowser(session);
      rhxFull(`rhx browser.start --mode HEADLESS --session ${session}`);
    });

    afterAll(() => {
      stopBrowser(session);
    });

    when('[t0] dispatcher invokes screen subcommand', () => {
      then('only screenshot is captured', () => {
        const result = rhxFull(`bash ${dispatcherPath} screen --tab 0 --session ${session}`);

        // verify it captures only screenshot
        expect(result.stdout).toContain('snapshot.png');
        // verify other assets are NOT in output
        expect(result.stdout).not.toContain('snapshot.meta.json');
        expect(result.stdout).not.toContain('snapshot.console.json');
        expect(result.stdout).not.toContain('snapshot.storage.json');
        expect(result.stdout).not.toContain('snapshot.network.json');
      });
    });

    when('[t1] dispatcher invokes meta subcommand', () => {
      then('only metadata is captured', () => {
        const result = rhxFull(`bash ${dispatcherPath} meta --tab 0 --session ${session}`);

        // verify it captures only metadata
        expect(result.stdout).toContain('snapshot.meta.json');
        // verify other assets are NOT in output
        expect(result.stdout).not.toContain('snapshot.png');
        expect(result.stdout).not.toContain('snapshot.console.json');
        expect(result.stdout).not.toContain('snapshot.storage.json');
        expect(result.stdout).not.toContain('snapshot.network.json');
      });
    });

    when('[t2] dispatcher invokes console subcommand', () => {
      then('only console logs are captured', () => {
        const result = rhxFull(`bash ${dispatcherPath} console --tab 0 --session ${session}`);

        // verify it captures only console
        expect(result.stdout).toContain('snapshot.console.json');
        // verify other assets are NOT in output
        expect(result.stdout).not.toContain('snapshot.png');
        expect(result.stdout).not.toContain('snapshot.meta.json');
        expect(result.stdout).not.toContain('snapshot.storage.json');
        expect(result.stdout).not.toContain('snapshot.network.json');
      });
    });

    when('[t3] dispatcher invokes storage subcommand', () => {
      then('only storage state is captured', () => {
        const result = rhxFull(`bash ${dispatcherPath} storage --tab 0 --session ${session}`);

        // verify it captures only storage
        expect(result.stdout).toContain('snapshot.storage.json');
        // verify other assets are NOT in output
        expect(result.stdout).not.toContain('snapshot.png');
        expect(result.stdout).not.toContain('snapshot.meta.json');
        expect(result.stdout).not.toContain('snapshot.console.json');
        expect(result.stdout).not.toContain('snapshot.network.json');
      });
    });

    when('[t4] dispatcher invokes network subcommand', () => {
      then('only network entries are captured', () => {
        const result = rhxFull(`bash ${dispatcherPath} network --tab 0 --session ${session}`);

        // verify it captures only network
        expect(result.stdout).toContain('snapshot.network.json');
        // verify other assets are NOT in output
        expect(result.stdout).not.toContain('snapshot.png');
        expect(result.stdout).not.toContain('snapshot.meta.json');
        expect(result.stdout).not.toContain('snapshot.console.json');
        expect(result.stdout).not.toContain('snapshot.storage.json');
      });
    });

    when('[t5] dispatcher invokes html subcommand', () => {
      then('only html is captured', () => {
        const result = rhxFull(`bash ${dispatcherPath} html --tab 0 --session ${session}`);

        // verify it captures only html
        expect(result.stdout).toContain('snapshot.html');
        // verify other assets are NOT in output
        expect(result.stdout).not.toContain('snapshot.png');
        expect(result.stdout).not.toContain('snapshot.meta.json');
        expect(result.stdout).not.toContain('snapshot.console.json');
        expect(result.stdout).not.toContain('snapshot.storage.json');
        expect(result.stdout).not.toContain('snapshot.network.json');
      });
    });
  });
});
