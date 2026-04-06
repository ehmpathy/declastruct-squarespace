#!/usr/bin/env -S npx tsx

/**
 * .what = list all domains in your Squarespace account with renewal status
 * .why = see which domains will auto-renew vs expire, sorted by expiration date
 *
 * usage:
 *   npx tsx provision/usecase.transferout/listDomains.ts
 *
 * prereq:
 *   credentials must be stored in keyrack (default owner, env prod):
 *   - SQUARESPACE_EMAIL
 *   - SQUARESPACE_PASSWORD
 *   - SQUARESPACE_TOTP_SECRET
 *
 * optional:
 *   BROWSER_WS_ENDPOINT=ws://localhost:... - connect to extant browser (faster)
 *
 * output:
 *   .temp/domains.csv - all domains with renewal status, sorted by expiration
 */
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import { getDeclastructSquarespaceProvider } from '../../src/contract/sdks/index';
import { getAllDomains } from '../../src/domain.operations/domainRegistration/getAllDomains';

/**
 * .what = fetch a key from keyrack
 * .why = secure credential access without env vars
 */
const fetchKeyFromKeyrack = (key: string): string | null => {
  try {
    // unlock keyrack first
    execSync(`npx rhx keyrack unlock --key ${key} --env prod`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // get the key
    const result = execSync(
      `npx rhx keyrack get --key ${key} --env prod --json`,
      {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
    const parsed = JSON.parse(result);
    return parsed.grant?.key?.secret ?? null;
  } catch {
    return null;
  }
};

const main = async () => {
  // auto-discover persistent browser via state file
  if (!process.env.BROWSER_WS_ENDPOINT) {
    const wsEndpointFile = join(
      process.cwd(),
      '.cache/browser.default/ws-endpoint',
    );
    if (existsSync(wsEndpointFile)) {
      process.env.BROWSER_WS_ENDPOINT = readFileSync(
        wsEndpointFile,
        'utf-8',
      ).trim();
      console.log(
        'auto-discovered browser at:',
        process.env.BROWSER_WS_ENDPOINT,
      );
    }
  }

  // fetch credentials from keyrack
  console.log('fetch credentials from keyrack...');
  const email = fetchKeyFromKeyrack('SQUARESPACE_EMAIL');
  const password = fetchKeyFromKeyrack('SQUARESPACE_PASSWORD');
  const totpSecret = fetchKeyFromKeyrack('SQUARESPACE_TOTP_SECRET');

  if (!email || !password) {
    console.error(
      'error: could not fetch SQUARESPACE_EMAIL or SQUARESPACE_PASSWORD from keyrack',
    );
    console.error('');
    console.error(
      'prereq: store credentials in keyrack (default owner, env prod)',
    );
    console.error('  npx rhx keyrack set --key SQUARESPACE_EMAIL --env prod');
    console.error(
      '  npx rhx keyrack set --key SQUARESPACE_PASSWORD --env prod',
    );
    console.error(
      '  npx rhx keyrack set --key SQUARESPACE_TOTP_SECRET --env prod',
    );
    process.exit(1);
  }

  console.log('create provider...');

  // create the provider
  const provider = getDeclastructSquarespaceProvider({
    account: {
      id: 'demo',
      email,
    },
    credentials: {
      email,
      password,
      totpSecret: totpSecret ?? undefined,
    },
    browser: {
      extantBrowserWSEndpoint: process.env.BROWSER_WS_ENDPOINT,
    },
    session: {
      storageStatePath: '.cache/squarespace-session.json',
    },
  });

  console.log('fetch domains...');

  // get all domains (renewal status included from list page)
  const domains = await getAllDomains({}, provider.context);

  // sort by expiration date (earliest first)
  const domainsSorted = [...domains].sort((a, b) => {
    const dateA = new Date(a.expirationDate).getTime();
    const dateB = new Date(b.expirationDate).getTime();
    return dateA - dateB;
  });

  // build csv with renewal column
  const csvLines = [
    'name,expires,renewal,status,locked,lockReason,dnssec,registrar',
    ...domainsSorted.map((domain) =>
      [
        domain.name,
        domain.expirationDate,
        domain.renewal,
        domain.status,
        domain.isLocked,
        domain.lockReason ?? '',
        domain.dnssecEnabled,
        domain.registrar,
      ].join(','),
    ),
  ];

  // write to .temp/domains.csv
  const tempDir = join(__dirname, '.temp');
  mkdirSync(tempDir, { recursive: true });
  const outputPath = join(tempDir, 'domains.csv');
  writeFileSync(outputPath, csvLines.join('\n'));

  // count by renewal status
  const enabledCount = domainsSorted.filter(
    (d) => d.renewal === 'ENABLED',
  ).length;
  const disabledCount = domainsSorted.filter(
    (d) => d.renewal === 'DISABLED',
  ).length;

  console.log(`found ${domains.length} domain(s)`);
  console.log(`  - ${enabledCount} with renewal ENABLED (will auto-renew)`);
  console.log(`  - ${disabledCount} with renewal DISABLED (will expire)`);
  console.log(`wrote: ${outputPath}`);

  // cleanup
  await provider.hooks.afterAll();
};

main().catch((err) => {
  console.error('error:', err.message);
  process.exit(1);
});
