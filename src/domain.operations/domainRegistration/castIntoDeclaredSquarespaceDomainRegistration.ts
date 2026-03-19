import { UnexpectedCodePathError } from 'helpful-errors';

import type { RawDomainDetail } from '../../access/sdks/squarespace.via.playwright/domainDetail/scrapeDomainDetail';
import { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';
import type { DeclaredSquarespaceDomainLockReason } from '../../domain.objects/literals/DeclaredSquarespaceDomainLockReason';
import type { DeclaredSquarespaceDomainRegistrationStatus } from '../../domain.objects/literals/DeclaredSquarespaceDomainRegistrationStatus';
import type { DeclaredSquarespaceRegistrarType } from '../../domain.objects/literals/DeclaredSquarespaceRegistrarType';

/**
 * .what = parses raw status string into typed status literal
 * .why = raw scraped text needs normalization to typed enum
 */
const parseStatus = (input: {
  status: string;
}): DeclaredSquarespaceDomainRegistrationStatus => {
  const statusLower = input.status.toLowerCase().trim();

  // check for active status
  if (statusLower.includes('active')) return 'ACTIVE';

  // check for expired status
  if (statusLower.includes('expired')) return 'EXPIRED';

  // check for pending status
  if (statusLower.includes('pending')) return 'PENDING';

  // default to active for unrecognized status
  return 'ACTIVE';
};

/**
 * .what = parses raw registrar string into typed registrar literal
 * .why = raw scraped text needs normalization to typed enum
 */
const parseRegistrar = (input: {
  registrar: string | null;
}): DeclaredSquarespaceRegistrarType => {
  // handle null registrar
  if (!input.registrar) return 'SQUARESPACE_DOMAINS_LLC';

  const registrarLower = input.registrar.toLowerCase().trim();

  // check for squarespace domains II llc
  if (registrarLower.includes('ii')) return 'SQUARESPACE_DOMAINS_II_LLC';

  // check for squarespace domains llc
  if (registrarLower.includes('squarespace')) return 'SQUARESPACE_DOMAINS_LLC';

  // check for tucows
  if (registrarLower.includes('tucows')) return 'TUCOWS';

  // check for key-systems
  if (registrarLower.includes('key')) return 'KEY_SYSTEMS';

  // default to squarespace domains llc
  return 'SQUARESPACE_DOMAINS_LLC';
};

/**
 * .what = parses raw lock reason string into typed lock reason literal
 * .why = raw scraped text needs normalization to typed enum
 */
const parseLockReason = (input: {
  lockReason: string | null;
}): DeclaredSquarespaceDomainLockReason | null => {
  // handle null lock reason
  if (!input.lockReason) return null;

  const reasonLower = input.lockReason.toLowerCase().trim();

  // check for registration lock
  if (reasonLower.includes('registration') || reasonLower.includes('new'))
    return 'REGISTRATION_LOCK_60_DAY';

  // check for transfer lock
  if (reasonLower.includes('transfer')) return 'TRANSFER_LOCK_60_DAY';

  // check for contact update lock
  if (reasonLower.includes('contact') || reasonLower.includes('registrant'))
    return 'CONTACT_UPDATE_LOCK';

  // unrecognized lock reason should fail fast
  throw new UnexpectedCodePathError('unrecognized lock reason', {
    lockReason: input.lockReason,
  });
};

/**
 * .what = parses raw expiration date string into ISO date string
 * .why = raw scraped text like "Dec 15, 2025" needs normalization
 */
const parseExpirationDate = (input: {
  expirationDate: string | null;
}): string => {
  // handle null expiration date
  if (!input.expirationDate) {
    return new Date().toISOString().split('T')[0]!; // default to today
  }

  // try to parse date string
  const parsed = new Date(input.expirationDate);
  const isValidDate = !isNaN(parsed.getTime());
  if (!isValidDate) {
    return new Date().toISOString().split('T')[0]!; // default to today if unparseable
  }

  // return ISO date string (date only)
  return parsed.toISOString().split('T')[0]!;
};

/**
 * .what = casts raw domain detail into typed DeclaredSquarespaceDomainRegistration
 * .why = transforms scraped data into domain object for type-safe operations
 */
export const castIntoDeclaredSquarespaceDomainRegistration = (input: {
  raw: RawDomainDetail;
  autoRenew?: boolean;
  dnssecEnabled?: boolean;
  createdAt?: string | null;
}): DeclaredSquarespaceDomainRegistration => {
  // parse status
  const status = parseStatus({ status: input.raw.status });

  // parse registrar
  const registrar = parseRegistrar({ registrar: input.raw.registrar });

  // parse lock reason
  const lockReason = parseLockReason({ lockReason: input.raw.lockReason });

  // parse expiration date
  const expirationDate = parseExpirationDate({
    expirationDate: input.raw.expirationDate,
  });

  // construct domain registration
  return new DeclaredSquarespaceDomainRegistration({
    name: input.raw.name,
    status,
    isLocked: input.raw.isLocked,
    lockReason,
    registrar,
    expirationDate,
    autoRenew: input.autoRenew ?? false,
    dnssecEnabled: input.dnssecEnabled ?? false,
    createdAt: input.createdAt ?? null,
  });
};
