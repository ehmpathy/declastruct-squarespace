/**
 * .what - Barrel export for all Squarespace domain objects
 * .why - Single import point for all types and domain entities
 */

export type {
  ContextSquarespaceAgent,
  ContextSquarespaceAgentPage,
} from './ContextSquarespaceAgent';
// Context types
export type { ContextSquarespaceAgentOptions } from './ContextSquarespaceAgentOptions';
export { DeclaredSquarespaceDomainDnsRecord } from './DeclaredSquarespaceDomainDnsRecord';
// Domain objects
export { DeclaredSquarespaceDomainRegistration } from './DeclaredSquarespaceDomainRegistration';
export { DeclaredSquarespaceDomainTransferRequest } from './DeclaredSquarespaceDomainTransferRequest';
// Literal types
export type {
  DeclaredSquarespaceDomainDnsRecordType,
  DeclaredSquarespaceDomainLockReason,
  DeclaredSquarespaceDomainRegistrationStatus,
  DeclaredSquarespaceRegistrarType,
  DeclaredSquarespaceTransferRequestStatus,
} from './literals';
