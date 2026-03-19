/**
 * .what - CSS selectors for Squarespace domain transfers page
 * .why - Centralizes selectors for maintainability
 */
export const transfersListSelectors = {
  // transfers page container
  container: '[data-test="transfers-list"], .transfers-list',

  // transfer request row
  transferRow: '[data-test="transfer-row"], .transfer-row',
  transferRowByDomain: (domain: string) =>
    `[data-test="transfer-row"][data-domain="${domain}"], .transfer-row[data-domain="${domain}"]`,

  // transfer row elements
  domainName: '[data-test="domain-name"], .domain-name',
  transferStatus: '[data-test="transfer-status"], .transfer-status',
  transferDirection: '[data-test="transfer-direction"], .transfer-direction',
  initiatedDate: '[data-test="initiated-date"], .initiated-date',
  expiresAt: '[data-test="expires-at"], .expires-at',

  // transfer actions
  initiateTransferButton:
    '[data-test="initiate-transfer"], button[aria-label*="Transfer"]',
  cancelTransferButton:
    '[data-test="cancel-transfer"], button[aria-label*="Cancel"]',
  approveTransferButton:
    '[data-test="approve-transfer"], button[aria-label*="Approve"]',
  rejectTransferButton:
    '[data-test="reject-transfer"], button[aria-label*="Reject"]',

  // auth code section
  authCodeSection: '[data-test="auth-code-section"], .auth-code-section',
  authCodeValue: '[data-test="auth-code-value"], .auth-code-value, code',
  copyAuthCodeButton:
    '[data-test="copy-auth-code"], button[aria-label*="Copy"]',
  generateAuthCodeButton:
    '[data-test="generate-auth-code"], button[aria-label*="Generate"]',
  revealAuthCodeButton:
    '[data-test="reveal-auth-code"], button[aria-label*="Reveal"]',

  // unlock for transfer section
  unlockSection: '[data-test="unlock-section"], .unlock-section',
  unlockButton: '[data-test="unlock-domain"], button[aria-label*="Unlock"]',
  unlockConfirmButton:
    '[data-test="confirm-unlock"], button[aria-label*="Confirm"]',

  // loading states
  loadingSpinner: '[data-test="loading"], .loading-spinner',
  emptyState: '[data-test="empty-state"], .empty-state',

  // modals
  confirmationModal: '[data-test="confirmation-modal"], [role="alertdialog"]',
  confirmButton: '[data-test="confirm"], button[aria-label*="Confirm"]',
  cancelModalButton: '[data-test="cancel-modal"], button[aria-label*="Cancel"]',

  // transfer page elements (consolidated from requestTransferCode.ts)
  transferTab: '[data-test="transfer-tab"], a[href*="/transfer"]',
  requestCodeButton:
    '[data-test="request-code"], button[aria-label*="Transfer"], button:has-text("Transfer")',
  confirmTransferButton:
    '[data-test="confirm-transfer"], button:has-text("Confirm")',
  transferCodeDisplay: '[data-test="transfer-code"], .transfer-code, code',
  successMessage: '[data-test="success"], .success-message',
  emailSentMessage: '.email-sent, [data-test="email-sent"]',
};
