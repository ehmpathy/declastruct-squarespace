/**
 * .what = declare transfer-ready state for domains that expire soon
 * .why = single declastruct run prepares domains for transfer-out
 *
 * usage:
 *   # start browser
 *   rhx browser.start --mode HEADFUL --refresh
 *
 *   # test env (uses ehmpath owner)
 *   ENV=test npx declastruct plan --wish provision/usecase.transferout/resources.ts --into provision/usecase.transferout/plan.json
 *   ENV=test npx declastruct apply --plan provision/usecase.transferout/plan.json
 *
 *   # prod env with date filter (domains that expire by may 1st)
 *   ENV=prod RENEWS_UNTIL=2026-05-01 npx declastruct plan --wish provision/usecase.transferout/resources.ts --into provision/usecase.transferout/plan.json
 *   ENV=prod npx declastruct apply --plan provision/usecase.transferout/plan.json
 *
 * config:
 *   ENV                   = test | prod (default: prod)
 *   RENEWS_UNTIL          = ISO date filter (default: 2 months from now)
 *   FILTER_DOMAIN         = filter to specific domain (e.g., rhoam.org)
 *   SKIP_TRANSFER_REQUEST = true to skip auth code request (default: false)
 *   nameservers           = edit nameservers.env=test.json or nameservers.env=prod.json
 */
import { refByUnique } from 'domain-objects';
import { readFileSync } from 'fs';
import { UnexpectedCodePathError } from 'helpful-errors';
import { join } from 'path';

import { DeclaredSquarespaceDomainNameservers } from '../../src/domain.objects/DeclaredSquarespaceDomainNameservers';
import { DeclaredSquarespaceDomainRegistration } from '../../src/domain.objects/DeclaredSquarespaceDomainRegistration';
import { DeclaredSquarespaceDomainTransferRequest } from '../../src/domain.objects/DeclaredSquarespaceDomainTransferRequest';
import { getAllDomains } from '../../src/domain.operations/domainRegistration/getAllDomains';
import { getProviders } from './getSquarespaceProvider';

export { getProviders };

// load nameservers from env-specific config
const env = process.env.ENV ?? 'prod';
const configPath = join(__dirname, `nameservers.env=${env}.json`);
const config = JSON.parse(readFileSync(configPath, 'utf-8')) as {
  nameservers: string[];
};
const NAMESERVERS = config.nameservers;

// compute default RENEWS_UNTIL (2 months from now)
const defaultRenewsUntil = new Date();
defaultRenewsUntil.setMonth(defaultRenewsUntil.getMonth() + 2);
const RENEWS_UNTIL =
  process.env.RENEWS_UNTIL ?? defaultRenewsUntil.toJSON().split('T')[0]!;

// optional: filter to specific domain
const FILTER_DOMAIN = process.env.FILTER_DOMAIN ?? null;

// optional: skip transfer request creation
const SKIP_TRANSFER_REQUEST = process.env.SKIP_TRANSFER_REQUEST === 'true';

/**
 * .what = resource declarations for transfer-out preparation
 * .why = declares target state: unlocked, nameservers set, auth code requested
 */
export const getResources = async () => {
  // get provider
  const [provider] = await getProviders();
  if (!provider) UnexpectedCodePathError.throw('provider required');

  // get all domains
  const allDomains = await getAllDomains({}, provider.context);

  // filter: renewal enabled AND expires by RENEWS_UNTIL AND not already expired
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewsUntilDate = new Date(RENEWS_UNTIL);
  let targetDomains = allDomains.filter(
    (d: DeclaredSquarespaceDomainRegistration) =>
      d.renewal === 'ENABLED' &&
      new Date(d.expirationDate) >= today &&
      new Date(d.expirationDate) <= renewsUntilDate,
  );

  // filter: specific domain if FILTER_DOMAIN set
  if (FILTER_DOMAIN) {
    targetDomains = targetDomains.filter(
      (d: DeclaredSquarespaceDomainRegistration) => d.name === FILTER_DOMAIN,
    );
  }

  // sort by expiration (earliest first)
  const sorted = [...targetDomains].sort(
    (a, b) =>
      new Date(a.expirationDate).getTime() -
      new Date(b.expirationDate).getTime(),
  );

  // emit treestruct summary to stdout
  console.log(`\n🌊 transfer-out preparation`);
  console.log(`   ├─ env: ${env}`);
  console.log(`   ├─ renews until: ${RENEWS_UNTIL}`);
  console.log(`   ├─ filter domain: ${FILTER_DOMAIN ?? '(none)'}`);
  console.log(`   ├─ skip transfer request: ${SKIP_TRANSFER_REQUEST}`);
  console.log(`   └─ nameservers: ${NAMESERVERS.join(', ')}`);
  console.log(
    `\n🐚 ${sorted.length}/${allDomains.length} domain(s) to prepare:`,
  );
  sorted.forEach((domain, i) => {
    const isLast = i === sorted.length - 1;
    const branch = isLast ? '└─' : '├─';
    const lockIcon = domain.isLocked ? '🔒' : '🔓';
    console.log(
      `   ${branch} ${lockIcon} ${domain.name} (expires: ${domain.expirationDate})`,
    );
  });
  console.log('');

  // return declarations for each domain
  const resources: (
    | DeclaredSquarespaceDomainRegistration
    | DeclaredSquarespaceDomainNameservers
    | DeclaredSquarespaceDomainTransferRequest
  )[] = [];

  for (const domain of sorted) {
    const domainRef =
      refByUnique<typeof DeclaredSquarespaceDomainRegistration>(domain);

    // declare: unlocked, dnssec disabled
    resources.push(
      new DeclaredSquarespaceDomainRegistration({
        ...domain,
        isLocked: false,
        dnssecEnabled: false,
      }),
    );

    // declare: nameservers set
    resources.push(
      new DeclaredSquarespaceDomainNameservers({
        domain: domainRef,
        nameservers: NAMESERVERS,
      }),
    );

    // declare: auth code requested (optional)
    if (!SKIP_TRANSFER_REQUEST) {
      resources.push(
        new DeclaredSquarespaceDomainTransferRequest({
          domain: domainRef,
          requestedAt: new Date().toJSON(),
          status: 'REQUESTED',
        }),
      );
    }
  }

  return resources;
};
