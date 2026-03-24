import { DomainEntity, DomainLiteral, type RefByUnique } from 'domain-objects';

import type { DeclaredSquarespaceDomainRegistration } from './DeclaredSquarespaceDomainRegistration';
import type { DeclaredSquarespaceTransferRequestStatus } from './literals/DeclaredSquarespaceTransferRequestStatus';

/**
 * .what - A request to transfer a domain out of Squarespace
 * .why - Tracks the transfer-out process for a domain
 * .identity - Uniquely identified by domain reference
 */
export interface DeclaredSquarespaceDomainTransferRequest {
  /**
   * .what - Reference to the domain under transfer
   */
  domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>;

  /**
   * .what - When the transfer code was requested
   */
  requestedAt: string; // ISO date string

  /**
   * .what - Status of the transfer request
   */
  status: DeclaredSquarespaceTransferRequestStatus;
}

export class DeclaredSquarespaceDomainTransferRequest extends DomainEntity<DeclaredSquarespaceDomainTransferRequest> {
  public static primary = ['domain'] as const;
  public static unique = ['domain'] as const;
  public static metadata = ['requestedAt'] as const;
  public static readonly = ['requestedAt', 'status'] as const;
  public static nested = { domain: DomainLiteral };
}
