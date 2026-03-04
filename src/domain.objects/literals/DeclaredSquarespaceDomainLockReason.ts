/**
 * .what - Reasons a domain cannot be unlocked
 * .why - Indicates transfer restrictions due to ICANN policies
 */
export type DeclaredSquarespaceDomainLockReason =
  | 'REGISTRATION_LOCK_60_DAY' // Newly registered within 60 days
  | 'TRANSFER_LOCK_60_DAY' // Transferred in within 60 days
  | 'CONTACT_UPDATE_LOCK'; // Registrant info changed recently
