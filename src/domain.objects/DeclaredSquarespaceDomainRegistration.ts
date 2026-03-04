import { DomainEntity } from 'domain-objects';

import type { DeclaredSquarespaceDomainLockReason } from './literals/DeclaredSquarespaceDomainLockReason';
import type { DeclaredSquarespaceDomainRegistrationStatus } from './literals/DeclaredSquarespaceDomainRegistrationStatus';
import type { DeclaredSquarespaceRegistrarType } from './literals/DeclaredSquarespaceRegistrarType';

/**
 * .what - A domain registered with or managed by Squarespace
 * .why - Represents the primary entity for domain management and transfer operations
 * .identity - Uniquely identified by domain name
 */
export interface DeclaredSquarespaceDomainRegistration {
  /**
   * .what - The domain name (e.g., "example.com")
   * .why - Primary identifier for the domain
   */
  name: string;

  /**
   * .what - Domain status
   * .why - Indicates if domain is active, expired, or pending
   */
  status: DeclaredSquarespaceDomainRegistrationStatus;

  /**
   * .what - Whether domain transfer lock is enabled
   * .why - Must be false (unlocked) to transfer domain out
   */
  isLocked: boolean;

  /**
   * .what - Reason domain cannot be unlocked (if applicable)
   * .why - Indicates 60-day registration/transfer lock or contact change lock
   */
  lockReason: DeclaredSquarespaceDomainLockReason | null;

  /**
   * .what - The registrar of record
   * .why - Different registrars have different transfer flows
   */
  registrar: DeclaredSquarespaceRegistrarType;

  /**
   * .what - When the domain registration expires
   * .why - Expired domains have 30-day transfer window
   */
  expirationDate: string; // ISO date string

  /**
   * .what - Whether auto-renewal is enabled
   * .why - Informational
   */
  autoRenew: boolean;

  /**
   * .what - Whether DNSSEC is enabled
   * .why - Must be disabled before transfer
   */
  dnssecEnabled: boolean;

  /**
   * .what - When the domain was registered/transferred to Squarespace
   * .why - Used to determine if 60-day lock applies
   */
  createdAt: string | null; // ISO date string, readonly
}

export class DeclaredSquarespaceDomainRegistration extends DomainEntity<DeclaredSquarespaceDomainRegistration> {
  public static primary = ['name'] as const;
  public static unique = ['name'] as const;
  public static metadata = [] as const;
  public static readonly = [
    'createdAt',
    'registrar',
    'status',
    'lockReason',
  ] as const;
}
