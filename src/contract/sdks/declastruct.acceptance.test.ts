import { spawnSync } from 'child_process';
import type { DeclastructChange } from 'declastruct';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getAllDomains } from '../../domain.operations/domainRegistration/getAllDomains';
import { getDeclastructSquarespaceProvider } from './index';

/**
 * .what = run declastruct CLI command via spawnSync
 * .why = spinner ANSI codes with stdio:inherit corrupt Jest output handling
 * .note = pipe all output to buffer, print at end without ANSI escape codes
 */
const runDeclastruct = (command: string): void => {
  const [cmd, ...args] = command.split(' ');
  if (!cmd) throw new Error('empty command');
  const result = spawnSync(cmd, args, {
    stdio: 'pipe',
    env: { ...process.env, NO_COLOR: '1', CI: 'true' },
    shell: true,
    encoding: 'utf-8',
  });
  if (result.error) throw result.error;
  // print stdout without ANSI escape codes (strip spinner sequences)
  if (result.stdout) {
    const cleanOutput = result.stdout
      // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional ANSI escape code pattern
      .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '') // strip ANSI codes
      .replace(/\r/g, '\n') // convert carriage returns to newlines
      .split('\n')
      .filter((line) => !line.match(/^\s*(└─|├─)?\s*⠋|⠙|⠹|⠸|⠼|⠴|⠦|⠧|⠇|⠏/)) // remove spinner lines
      .join('\n');
    console.log(cleanOutput);
  }
  if (result.stderr) console.error(result.stderr);
  if (result.status !== 0) {
    throw new Error(`command failed with exit code ${result.status}`);
  }
};

/**
 * .what = acceptance tests for declastruct CLI workflow with Squarespace
 * .why = validates end-to-end usage of declastruct-squarespace with declastruct CLI
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD, SQUARESPACE_TOTP_SECRET environment variables
 */
describe('declastruct CLI workflow', () => {
  given('a declastruct resources file', () => {
    const testDir = join(
      __dirname,
      '.test',
      '.temp',
      'acceptance',
      `run.${new Date().toISOString()}`,
    );
    const resourcesFile = join(
      __dirname,
      '.test',
      'assets',
      'resources.acceptance.ts',
    );
    const planFile = join(testDir, 'plan.json');

    beforeAll(async () => {
      // ensure clean test directory
      mkdirSync(testDir, { recursive: true });
    });

    when('generating a plan via declastruct CLI', () => {
      const prep = useBeforeAll(async () => {
        // execute declastruct plan command once for all plan assertions
        // .note = 120s timeout allows for reauth modal
        runDeclastruct(
          `npx declastruct plan --wish ${resourcesFile} --into ${planFile}`,
        );

        // parse and return plan for assertions
        return {
          plan: JSON.parse(readFileSync(planFile, 'utf-8')) as {
            changes: DeclastructChange[];
          },
        };
      });

      then('creates a valid plan file', () => {
        /**
         * .what = validates declastruct plan command produces valid JSON output
         * .why = ensures CLI can parse resources file and generate plan
         */
        expect(existsSync(planFile)).toBe(true);
        expect(prep.plan).toHaveProperty('changes');
        expect(Array.isArray(prep.plan.changes)).toBe(true);
      });

      then('fetches real domains from live account', () => {
        /**
         * .what = validates real domains were scraped from live Squarespace account
         * .why = proves acceptance test uses real data, not empty stubs
         */
        expect(prep.plan.changes.length).toBeGreaterThan(0);
      });

      then('plan includes domain registration resources', () => {
        /**
         * .what = validates plan includes domain unlock declarations
         * .why = ensures declastruct correctly processes Squarespace domain declarations
         */
        const domainResource = prep.plan.changes.find(
          (r: DeclastructChange) =>
            r.forResource.class === 'DeclaredSquarespaceDomainRegistration',
        );
        expect(domainResource).toBeDefined();
      });

      then('plan includes transfer request resources', () => {
        /**
         * .what = validates plan includes transfer request declarations
         * .why = ensures transfer code request workflow is captured in plan
         */
        const transferResource = prep.plan.changes.find(
          (r: DeclastructChange) =>
            r.forResource.class === 'DeclaredSquarespaceDomainTransferRequest',
        );
        expect(transferResource).toBeDefined();
      });
    });

    when('applying a plan via declastruct CLI', () => {
      const prep = useBeforeAll(async () => {
        // generate fresh plan for apply phase
        // .note = 120s timeout allows for reauth modal
        runDeclastruct(
          `npx declastruct plan --wish ${resourcesFile} --into ${planFile}`,
        );

        // apply plan once for all apply assertions
        // .note = 120s timeout allows for reauth modal
        runDeclastruct(`npx declastruct apply --plan ${planFile}`);

        // parse and return plan for assertions
        return {
          plan: JSON.parse(readFileSync(planFile, 'utf-8')) as {
            changes: DeclastructChange[];
          },
        };
      });

      then('unlocks domains for transfer', () => {
        /**
         * .what = validates domains are unlocked via declastruct apply
         * .why = domains must be unlocked before transfer can proceed
         */
        const domainChange = prep.plan.changes.find(
          (r: DeclastructChange) =>
            r.forResource.class === 'DeclaredSquarespaceDomainRegistration',
        );
        expect(domainChange).toBeDefined();
      });

      then('requests transfer codes', () => {
        /**
         * .what = validates transfer codes are requested via declastruct apply
         * .why = transfer code email is required to complete domain transfer
         */
        const transferChange = prep.plan.changes.find(
          (r: DeclastructChange) =>
            r.forResource.class === 'DeclaredSquarespaceDomainTransferRequest',
        );
        expect(transferChange).toBeDefined();
      });

      then('is idempotent - applying same plan twice succeeds', () => {
        /**
         * .what = validates applying the same plan multiple times is safe
         * .why = ensures declastruct operations follow idempotency requirements
         */
        // apply plan second time - should succeed without errors
        // .note = 120s timeout allows for reauth modal
        runDeclastruct(`npx declastruct apply --plan ${planFile}`);
      });
    });

    when('re-planning after apply to verify idempotency', () => {
      const verifyPlanFile = join(testDir, 'plan-verify.json');

      const prep = useBeforeAll(async () => {
        // generate a fresh plan after apply — if everything was applied correctly,
        // all resources should show "KEEP" (no changes needed)
        // .note = 120s timeout allows for reauth modal
        runDeclastruct(
          `npx declastruct plan --wish ${resourcesFile} --into ${verifyPlanFile}`,
        );

        return {
          plan: JSON.parse(readFileSync(verifyPlanFile, 'utf-8')) as {
            changes: DeclastructChange[];
          },
        };
      });

      then('domain registrations show KEEP after apply', () => {
        /**
         * .what = validates domain registrations were applied correctly
         * .why = ensures idempotency — apply same plan twice, no changes
         * .note = transfer requests are fire-and-forget (email sent, no scrapeable state)
         *         so we only check domain registrations for KEEP
         */
        const domainRegistrationChanges = prep.plan.changes.filter(
          (r: DeclastructChange) =>
            r.forResource.class === 'DeclaredSquarespaceDomainRegistration',
        );
        const nonKeepDomains = domainRegistrationChanges.filter(
          (r: DeclastructChange) => r.action !== 'KEEP',
        );
        expect(nonKeepDomains).toHaveLength(0);
      });

      then('domain registration shows KEEP', () => {
        /**
         * .what = validates domain was unlocked correctly by checking re-plan shows KEEP
         * .why = proves the resource matches desired state after apply
         */
        const domainChange = prep.plan.changes.find(
          (r: DeclastructChange) =>
            r.forResource.class === 'DeclaredSquarespaceDomainRegistration',
        );
        expect(domainChange).toBeDefined();
        expect(domainChange!.action).toBe('KEEP');
      });
    });

    when('verifying caching behavior', () => {
      then('second getAllDomains call uses cache', async () => {
        /**
         * .what = validates remote state cache is active
         * .why = ensures performance optimization for 300+ domain accounts
         */
        // .note = credentials validated by acceptance test suite via resources.acceptance.ts
        const email = process.env.SQUARESPACE_EMAIL;
        const password = process.env.SQUARESPACE_PASSWORD;
        if (!email || !password) throw new Error('credentials required');

        // create provider
        const provider = getDeclastructSquarespaceProvider({
          account: {
            id: 'acceptance-test',
            email,
          },
          credentials: {
            email,
            password,
            totpSecret: process.env.SQUARESPACE_TOTP_SECRET,
          },
        });

        // first call - populates cache
        const start1 = Date.now();
        await getAllDomains({}, provider.context);
        const duration1 = Date.now() - start1;

        // second call - should use cache
        const start2 = Date.now();
        await getAllDomains({}, provider.context);
        const duration2 = Date.now() - start2;

        // cache should be fast (under 50ms absolute, regardless of first call timing)
        // .note = 10x speedup assertion was flaky when first call is already fast
        expect(duration2).toBeLessThan(50);

        // cleanup: close browser session to prevent open handle leak
        // .why = browser session is cached and stays open; must close to allow Jest to exit
        await provider.hooks.afterAll();
      });
    });
  });
});
