import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { createHash } from 'crypto';

import { createCache } from 'simple-on-disk-cache';

/**
 * .what = shared test utils for cache skill integration tests
 */

// hash email same way as the skill (first 12 chars of sha256)
export const hashEmail = (email: string): string =>
  createHash('sha256').update(email).digest('hex').slice(0, 12);

// create a temp directory with cache fixture via simple-on-disk-cache
export const genTempCacheDir = async (input: {
  email: string;
  entries: Array<{
    key: string;
    value: unknown;
    expiration?: { seconds?: number; minutes?: number; hours?: number; days?: number };
  }>;
}): Promise<{ dir: string; cacheDir: string; cleanup: () => void }> => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-test-'));
  const cacheDir = path.join(tempDir, 'squarespace');

  const cache = createCache({
    directory: { mounted: { path: cacheDir } },
    expiration: { days: 30 }, // default
  });

  const emailHash = hashEmail(input.email);

  // write cache entries via the actual cache library
  // format matches production: {operation}.{emailHash}..{inputHash}.v1
  for (const entry of input.entries) {
    const cacheKey = `${entry.key}.${emailHash}..test.v1`;
    await cache.set(
      cacheKey,
      JSON.stringify(entry.value),
      entry.expiration ? { expiration: entry.expiration } : undefined,
    );
  }

  return {
    dir: tempDir,
    cacheDir,
    cleanup: () => fs.rmSync(tempDir, { recursive: true, force: true }),
  };
};

// read cache entry from dir (raw JSON parse)
export const readCacheEntry = (input: {
  cacheDir: string;
  email: string;
  key: string;
}): { expiresAtMse: number; value: unknown } | null => {
  const emailHash = hashEmail(input.email);
  const filename = `${emailHash}.${input.key}.v1`;
  const filepath = path.join(input.cacheDir, filename);

  if (!fs.existsSync(filepath)) return null;

  const content = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(content);
};

// list cache files for email (matches *.{emailHash}.* pattern)
export const listCacheFiles = (input: {
  cacheDir: string;
  email: string;
}): string[] => {
  const emailHash = hashEmail(input.email);

  if (!fs.existsSync(input.cacheDir)) return [];

  return fs
    .readdirSync(input.cacheDir)
    .filter((f) => f.includes(`.${emailHash}.`));
};

// result of a command execution
export interface RhxResult {
  stdout: string;
  stderr: string;
  status: number | null;
}

// run cache skill with custom CACHE_DIR
export const rhxCache = (
  cmd: string,
  cacheDir: string,
): RhxResult => {
  const result = spawnSync('bash', ['-c', cmd], {
    encoding: 'utf-8',
    env: {
      ...process.env,
      CACHE_DIR: cacheDir,
    },
    cwd: process.cwd(),
  });

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status,
  };
};
