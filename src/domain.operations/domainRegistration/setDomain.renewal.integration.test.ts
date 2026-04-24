import { existsSync, readFileSync, readdirSync } from 'fs';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceContext,
  requireSquarespaceCredentials,
} from '../../.test/getSampleSquarespaceContext';
import { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';
import { getAllDomains } from './getAllDomains';
import { getOneDomain } from './getOneDomain';
import { setDomain } from './setDomain';

/**
 * .what = helper to find and read the getAllDomains cache file
 * .why = allows inspection of cache to verify it was updated, not invalidated
 */
const getAllDomainsCacheFile = (): {
  path: string;
  content: string;
  parsed: { value: unknown[] };
} | null => {
  const cacheDir = '.cache/squarespace';
  if (!existsSync(cacheDir)) return null;

  const files = readdirSync(cacheDir);
  const cacheFile = files.find((f) => f.startsWith('getAllDomains.'));
  if (!cacheFile) return null;

  const path = `${cacheDir}/${cacheFile}`;
  const content = readFileSync(path, 'utf-8');
  const parsed = JSON.parse(content);
  return { path, content, parsed };
};

/**
 * .what = integration test for setDomain renewal toggle
 * .why = proves round-trip renewal toggle works with gets to verify state changes
 */
describe('setDomain.renewal', () => {
  requireSquarespaceCredentials();

  const TEST_DOMAIN =
    process.env.SQUARESPACE_TEST_DOMAIN ?? 'sunshineoceansurferturtles.com';

  const context = getSampleSquarespaceContext();

  given('[case1] a domain with known renewal state', () => {
    // get initial state and toggle to opposite
    const toggleResult = useBeforeAll(async () => {
      // get initial state
      const domainBefore = await getOneDomain(
        { by: { unique: { name: TEST_DOMAIN } } },
        context,
      );
      if (!domainBefore) throw new Error(`domain not found: ${TEST_DOMAIN}`);
      const originalState = domainBefore.renewal;
      const targetState = originalState === 'ENABLED' ? 'DISABLED' : 'ENABLED';

      // toggle to opposite
      const domainAfterToggle = await setDomain(
        { upsert: { name: TEST_DOMAIN, renewal: targetState } },
        context,
      );

      // verify via fresh get
      const domainVerified = await getOneDomain(
        { by: { unique: { name: TEST_DOMAIN } } },
        context,
      );
      if (!domainVerified) throw new Error(`domain not found: ${TEST_DOMAIN}`);

      // restore original state
      const domainRestored = await setDomain(
        { upsert: { name: TEST_DOMAIN, renewal: originalState } },
        context,
      );

      // final verify
      const domainFinal = await getOneDomain(
        { by: { unique: { name: TEST_DOMAIN } } },
        context,
      );
      if (!domainFinal) throw new Error(`domain not found: ${TEST_DOMAIN}`);

      return {
        originalState,
        targetState,
        domainAfterToggle,
        domainVerified,
        domainRestored,
        domainFinal,
      };
    });

    when('[t0] renewal is toggled to opposite state', () => {
      then('setDomain returns new renewal state', () => {
        expect(toggleResult.domainAfterToggle.renewal).toBe(
          toggleResult.targetState,
        );
      });

      then('getOneDomain confirms the change', () => {
        expect(toggleResult.domainVerified.renewal).toBe(
          toggleResult.targetState,
        );
        expect(toggleResult.domainVerified.renewal).not.toBe(
          toggleResult.originalState,
        );
      });
    });

    when('[t1] renewal is toggled back to original state', () => {
      then('setDomain returns original renewal state', () => {
        expect(toggleResult.domainRestored.renewal).toBe(
          toggleResult.originalState,
        );
      });

      then('getOneDomain confirms restoration', () => {
        expect(toggleResult.domainFinal.renewal).toBe(
          toggleResult.originalState,
        );
      });
    });
  });

  given('[case2] setDomain with findsert on renewal', () => {
    const findsertResult = useBeforeAll(async () => {
      const domain = await getOneDomain(
        { by: { unique: { name: TEST_DOMAIN } } },
        context,
      );
      if (!domain) throw new Error(`domain not found: ${TEST_DOMAIN}`);

      // findsert with same state should be a no-op
      const result = await setDomain(
        { findsert: { name: TEST_DOMAIN, renewal: domain.renewal } },
        context,
      );

      return { domain, result };
    });

    when('[t0] findsert with same renewal state', () => {
      then('returns domain without change (no-op)', () => {
        expect(findsertResult.result.renewal).toBe(
          findsertResult.domain.renewal,
        );
      });
    });
  });

  given('[case3] setDomain updates cache in place (not invalidate)', () => {
    const cacheUpdateResult = useBeforeAll(async () => {
      // 1. call getAllDomains to ensure cache is populated
      const domainsBefore = await getAllDomains({}, context);
      const domainBefore = domainsBefore.find(
        (d: DeclaredSquarespaceDomainRegistration) => d.name === TEST_DOMAIN,
      );
      if (!domainBefore) throw new Error(`domain not found: ${TEST_DOMAIN}`);

      // 2. read cache file before mutation
      const cacheBefore = getAllDomainsCacheFile();
      if (!cacheBefore) throw new Error('cache file not found before mutation');

      // 3. toggle renewal via setDomain
      const originalState = domainBefore.renewal;
      const targetState = originalState === 'ENABLED' ? 'DISABLED' : 'ENABLED';
      await setDomain(
        { upsert: { name: TEST_DOMAIN, renewal: targetState } },
        context,
      );

      // 4. read cache file after mutation (should still exist, not deleted)
      const cacheAfter = getAllDomainsCacheFile();

      // 5. restore original state
      await setDomain(
        { upsert: { name: TEST_DOMAIN, renewal: originalState } },
        context,
      );

      // 6. read cache after restore
      const cacheAfterRestore = getAllDomainsCacheFile();

      return {
        originalState,
        targetState,
        cacheBefore,
        cacheAfter,
        cacheAfterRestore,
      };
    });

    when('[t0] setDomain mutates a domain', () => {
      then('cache file still exists (not deleted)', () => {
        expect(cacheUpdateResult.cacheAfter).not.toBeNull();
        expect(cacheUpdateResult.cacheAfter?.path).toBe(
          cacheUpdateResult.cacheBefore.path,
        );
      });

      then('cache contains updated domain with new renewal state', () => {
        const domainsInCache = cacheUpdateResult.cacheAfter?.parsed
          .value as Array<{ name: string; renewal: string }>;
        const domainInCache = domainsInCache?.find(
          (d) => d.name === TEST_DOMAIN,
        );
        expect(domainInCache?.renewal).toBe(cacheUpdateResult.targetState);
      });

      then('cache is restored after second mutation', () => {
        const domainsInCache = cacheUpdateResult.cacheAfterRestore?.parsed
          .value as Array<{ name: string; renewal: string }>;
        const domainInCache = domainsInCache?.find(
          (d) => d.name === TEST_DOMAIN,
        );
        expect(domainInCache?.renewal).toBe(cacheUpdateResult.originalState);
      });
    });
  });
});
