import { createCache } from 'simple-on-disk-cache';
import { given, then, when, useBeforeAll } from 'test-fns';

import {
  genTempCacheDir,
  hashEmail,
  listCacheFiles,
  readCacheEntry,
  rhxCache,
} from './.test/infra/cache';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('cache.extend', () => {
  given('[case1] cache entry that expired', () => {
    const email = 'test@example.com';

    const scene = useBeforeAll(async () => {
      // create cache with entry that expires in 1 second
      const { cacheDir, cleanup } = await genTempCacheDir({
        email,
        entries: [
          {
            key: 'getAllDomains',
            value: [{ name: 'example.com' }],
            expiration: { seconds: 1 },
          },
        ],
      });

      return { cacheDir, cleanup };
    });

    afterAll(() => scene.cleanup());

    when('[t0] entry has expired', () => {
      then('cache.get returns undefined', async () => {
        // wait for expiration
        await sleep(1500);

        // verify entry is expired via cache library
        const cache = createCache({
          directory: { mounted: { path: scene.cacheDir } },
        });
        const emailHash = hashEmail(email);
        const value = await cache.get(`getAllDomains.${emailHash}..test.v1`);

        expect(value).toBeUndefined();
      });
    });

    when('[t1] cache.extend is run after expiration', () => {
      then('entry becomes readable again', async () => {
        // run cache.extend
        const result = rhxCache(
          `bash .agent/repo=.this/role=any/skills/cache.extend.sh --for ${email} --by 1d`,
          scene.cacheDir,
        );

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('extend 1 cache file(s)');
        expect(result.stdout).toContain('done');

        // verify entry is now readable
        const cache = createCache({
          directory: { mounted: { path: scene.cacheDir } },
        });
        const emailHash = hashEmail(email);
        const value = await cache.get(`getAllDomains.${emailHash}..test.v1`);

        expect(value).toBeDefined();
        const parsed = JSON.parse(value!);
        expect(parsed).toEqual([{ name: 'example.com' }]);
      });
    });
  });

  given('[case2] no cache files for email', () => {
    const email = 'nobody@example.com';

    const scene = useBeforeAll(async () => {
      // create empty cache dir
      const { cacheDir, cleanup } = await genTempCacheDir({
        email: 'other@example.com', // different email
        entries: [],
      });

      return { cacheDir, cleanup };
    });

    afterAll(() => scene.cleanup());

    when('[t0] cache.extend is run', () => {
      then('it reports no files found', () => {
        const result = rhxCache(
          `bash .agent/repo=.this/role=any/skills/cache.extend.sh --for ${email}`,
          scene.cacheDir,
        );

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('no cache files found');
        expect(result.stdout).toContain(hashEmail(email));
      });
    });
  });

  given('[case3] missing --for argument', () => {
    when('[t0] cache.extend is run without --for', () => {
      then('it fails with error', () => {
        const result = rhxCache(
          'bash .agent/repo=.this/role=any/skills/cache.extend.sh',
          '/tmp',
        );

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('--for <email> required');
      });
    });
  });

  given('[case4] multiple cache entries for same email', () => {
    const email = 'multi@example.com';

    const scene = useBeforeAll(async () => {
      const { cacheDir, cleanup } = await genTempCacheDir({
        email,
        entries: [
          {
            key: 'getAllDomains',
            value: [{ name: 'example.com' }],
            expiration: { seconds: 1 },
          },
          {
            key: 'getAllDnsRecords',
            value: [{ type: 'A', name: '@' }],
            expiration: { seconds: 1 },
          },
        ],
      });

      return { cacheDir, cleanup };
    });

    afterAll(() => scene.cleanup());

    when('[t0] cache.extend is run', () => {
      then('all entries are extended', async () => {
        // wait for expiration
        await sleep(1500);

        // run cache.extend
        const result = rhxCache(
          `bash .agent/repo=.this/role=any/skills/cache.extend.sh --for ${email} --by 1d`,
          scene.cacheDir,
        );

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('extend 2 cache file(s)');

        // verify both entries are readable
        const cache = createCache({
          directory: { mounted: { path: scene.cacheDir } },
        });
        const emailHash = hashEmail(email);

        const domains = await cache.get(`getAllDomains.${emailHash}..test.v1`);
        const dns = await cache.get(`getAllDnsRecords.${emailHash}..test.v1`);

        expect(domains).toBeDefined();
        expect(dns).toBeDefined();
      });
    });
  });
});
