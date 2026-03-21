import { spawnSync } from 'child_process';

/**
 * .what = shared test utils for browser skill integration tests
 */

// test cache root (isolated from main .cache)
export const CACHE_ROOT = '.temp/.cache';
const env = { CACHE_ROOT };

// get wsEndpoint file for session
export const getWsEndpointFile = (session: string) =>
  `${CACHE_ROOT}/browser.${session}/ws-endpoint`;

// result of a command execution
export interface RhxResult {
  stdout: string;
  stderr: string;
  combined: string;
}

// run rhx with CACHE_ROOT, capture stdout and stderr
export const rhx = (cmd: string): string => {
  const result = rhxFull(cmd);
  return result.combined;
};

// run rhx and return full result with stdout, stderr, combined
export const rhxFull = (cmd: string): RhxResult => {
  const result = spawnSync('bash', ['-c', cmd], {
    encoding: 'utf-8',
    env: { ...process.env, ...env },
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    const err = new Error(
      `command failed: ${cmd}\nstderr: ${result.stderr}\nstdout: ${result.stdout}`,
    );
    (err as Error & { stderr: string; stdout: string }).stderr = result.stderr;
    (err as Error & { stderr: string; stdout: string }).stdout = result.stdout;
    throw err;
  }

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    combined: `${result.stdout || ''}${result.stderr || ''}`,
  };
};

// stop browser and suppress errors
export const stopBrowser = (session = 'default') => {
  try {
    rhx(`rhx browser.stop --session ${session}`);
  } catch {
    // ignore errors if browser not active
  }
};

// redact dynamic values in output for stable snapshots
export const asStableSnapshot = (output: string) =>
  output
    // strip ANSI escape codes for stable snapshots
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/ws:\/\/localhost:\d+\/devtools\/browser\/[a-f0-9-]+/g, 'ws://localhost:PORT/devtools/browser/UUID')
    .replace(/port: \d+/g, 'port: PORT')
    .replace(/\d{8}T\d{6}Z/g, 'ISOTIME')
    .replace(/\.temp\/\.cache\//g, '.cache/')
    .replace(/\.cache\/browser\.([\w-]+)\/snapshot\.[^/\s]+/g, '.cache/browser.$1/snapshot.ISOTIME.tabN');
