/**
 * .what - Transfer request status values
 * .why - Tracks the state of a domain transfer-out request
 */
export type DeclaredSquarespaceTransferRequestStatus =
  | 'REQUESTED' // Code requested, waiting for email
  | 'CODE_SENT' // Email with code was sent
  | 'IN_PROGRESS' // Transfer initiated at receiving registrar
  | 'COMPLETED' // Transfer completed
  | 'CANCELLED'; // Transfer cancelled within grace period
