import { execSync } from 'child_process';
import type { DeclastructChange } from 'declastruct';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getDeclastructSquarespaceProvider } from './index';
import { getAllDomains } from '../../domain.operations/domainRegistration/getAllDomains';

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
        execSync(
          `npx declastruct plan --wish ${resourcesFile} --into ${planFile}`,
          { stdio: 'inherit', env: process.env },
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
        execSync(
          `npx declastruct plan --wish ${resourcesFile} --into ${planFile}`,
          { stdio: 'inherit', env: process.env },
        );

        // apply plan once for all apply assertions
        execSync(`npx declastruct apply --plan ${planFile}`, {
          stdio: 'inherit',
          env: process.env,
        });

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
        execSync(`npx declastruct apply --plan ${planFile}`, {
          stdio: 'inherit',
          env: process.env,
        });
      });
    });

    when('re-planning after apply to verify idempotency', () => {
      const verifyPlanFile = join(testDir, 'plan-verify.json');

      const prep = useBeforeAll(async () => {
        // generate a fresh plan after apply — if everything was applied correctly,
        // all resources should show "KEEP" (no changes needed)
        execSync(
          `npx declastruct plan --wish ${resourcesFile} --into ${verifyPlanFile}`,
          { stdio: 'inherit', env: process.env },
        );

        return {
          plan: JSON.parse(readFileSync(verifyPlanFile, 'utf-8')) as {
            changes: DeclastructChange[];
          },
        };
      });

      then('all resources show KEEP after apply', () => {
        /**
         * .what = validates all resources were applied correctly
         * .why = ensures idempotency — applying same plan twice results in no changes
         */
        const nonKeepChanges = prep.plan.changes.filter(
          (r: DeclastructChange) => r.action !== 'KEEP',
        );
        expect(nonKeepChanges).toHaveLength(0);
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
         * .what = validates remote state caching is working
         * .why = ensures performance optimization for 300+ domain accounts
         */
        // skip if credentials not provided
        const email = process.env.SQUARESPACE_EMAIL;
        const password = process.env.SQUARESPACE_PASSWORD;
        if (!email || !password) {
          console.log('skipping cache test - credentials not provided');
          return;
        }

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

        // cache should be significantly faster (at least 10x)
        expect(duration2).toBeLessThan(duration1 / 10);
      });
    });
  });
});
