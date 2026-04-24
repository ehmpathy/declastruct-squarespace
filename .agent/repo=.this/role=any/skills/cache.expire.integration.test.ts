import { createCache } from 'simple-on-disk-cache';
import { given, then, when, useBeforeAll } from 'test-fns';

import {
  genTempCacheDir,
  hashEmail,
  listCacheFiles,
  rhxCache,
} from './.test/infra/cache';

describe('cache.expire', () => {
  given('[case1] cache entry exists', () => {
    const email = 'test@example.com';

    const scene = useBeforeAll(async () => {
      const { cacheDir, cleanup } = await genTempCacheDir({
        email,
        entries: [
          {
            key: 'getAllDomains',
            value: [{ name: 'example.com' }],
            expiration: { days: 30 },
          },
        ],
      });

      return { cacheDir, cleanup };
    });

    afterAll(() => scene.cleanup());

    when('[t0] cache.expire is run', () => {
      then('cache files are deleted', async () => {
        // verify file exists before
        const filesBefore = listCacheFiles({
          cacheDir: scene.cacheDir,
          email,
        });
        expect(filesBefore.length).toBe(1);

        // run cache.expire
        const result = rhxCache(
          `bash .agent/repo=.this/role=any/skills/cache.expire.sh --for ${email}`,
          scene.cacheDir,
        );

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('expire 1 cache file(s)');
        expect(result.stdout).toContain('deleted:');
        expect(result.stdout).toContain('done');

        // verify file is gone
        const filesAfter = listCacheFiles({
          cacheDir: scene.cacheDir,
          email,
        });
        expect(filesAfter.length).toBe(0);

        // verify cache.get returns undefined
        const cache = createCache({
          directory: { mounted: { path: scene.cacheDir } },
        });
        const emailHash = hashEmail(email);
        const value = await cache.get(`${emailHash}.getAllDomains.v1`);
        expect(value).toBeUndefined();
      });
    });
  });

  given('[case2] no cache files for email', () => {
    const email = 'nobody@example.com';

    const scene = useBeforeAll(async () => {
      const { cacheDir, cleanup } = await genTempCacheDir({
        email: 'other@example.com',
        entries: [],
      });

      return { cacheDir, cleanup };
    });

    afterAll(() => scene.cleanup());

    when('[t0] cache.expire is run', () => {
      then('it reports no files found', () => {
        const result = rhxCache(
          `bash .agent/repo=.this/role=any/skills/cache.expire.sh --for ${email}`,
          scene.cacheDir,
        );

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('no cache files found');
        expect(result.stdout).toContain(hashEmail(email));
      });
    });
  });

  given('[case3] absent --for argument', () => {
    when('[t0] cache.expire is run without --for', () => {
      then('it fails with error', () => {
        const result = rhxCache(
          'bash .agent/repo=.this/role=any/skills/cache.expire.sh',
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
            expiration: { days: 30 },
          },
          {
            key: 'getAllDnsRecords',
            value: [{ type: 'A', name: '@' }],
            expiration: { days: 30 },
          },
        ],
      });

      return { cacheDir, cleanup };
    });

    afterAll(() => scene.cleanup());

    when('[t0] cache.expire is run', () => {
      then('all entries are deleted', () => {
        // verify files exist before
        const filesBefore = listCacheFiles({
          cacheDir: scene.cacheDir,
          email,
        });
        expect(filesBefore.length).toBe(2);

        // run cache.expire
        const result = rhxCache(
          `bash .agent/repo=.this/role=any/skills/cache.expire.sh --for ${email}`,
          scene.cacheDir,
        );

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('expire 2 cache file(s)');

        // verify all files are gone
        const filesAfter = listCacheFiles({
          cacheDir: scene.cacheDir,
          email,
        });
        expect(filesAfter.length).toBe(0);
      });
    });
  });
});
