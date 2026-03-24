/**
 * .what - Transfer request status values
 * .why - Tracks the state of a domain transfer-out request
 */
export type DeclaredSquarespaceTransferRequestStatus =
  | 'REQUESTED' // Code requested, awaited email
  | 'CODE_DISPLAYED' // Code was displayed on page (captured)
  | 'CODE_SENT' // Email with code was sent
  | 'IN_PROGRESS' // Transfer initiated at the new registrar
  | 'COMPLETED' // Transfer completed
  | 'CANCELLED'; // Transfer cancelled within grace period
