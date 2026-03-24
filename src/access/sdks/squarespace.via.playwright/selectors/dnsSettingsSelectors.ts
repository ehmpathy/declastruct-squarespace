/**
 * .what - CSS selectors for Squarespace DNS settings page
 * .why - Centralizes selectors for maintainability
 *
 * .note - squarespace uses data-testid (not data-test)
 * .note - column order: Host, Type, Priority, TTL, Data
 */
export const dnsSettingsSelectors = {
  // DNS settings page container
  container: '[data-testid="dns-settings"], .dns-settings, main',

  // DNS records table
  recordsTable: 'table',
  recordRow: '[data-testid="dns-record-row"], tr[data-testid]',

  // record row cells (by position: Host, Type, Priority, TTL, Data)
  // .note - use td:nth-child(N) since cells don't have data-testid
  recordHost: 'td:nth-child(1)',
  recordType: 'td:nth-child(2)',
  recordPriority: 'td:nth-child(3)',
  recordTtl: 'td:nth-child(4)',
  recordValue: 'td:nth-child(5)',

  // record actions
  editRecordButton: '[data-test="edit-record"], button[aria-label*="Edit"]',
  deleteRecordButton:
    '[data-test="delete-record"], button[aria-label*="Delete"]',

  // add record form
  addRecordButton: '[data-test="add-record"], button[aria-label*="Add record"]',
  recordTypeSelect: '[data-test="record-type-select"], select[name="type"]',
  hostInput: '[data-test="host-input"], input[name="host"]',
  valueInput:
    '[data-test="value-input"], input[name="value"], textarea[name="value"]',
  ttlSelect: '[data-test="ttl-select"], select[name="ttl"]',
  priorityInput: '[data-test="priority-input"], input[name="priority"]',
  saveRecordButton: '[data-test="save-record"], button[type="submit"]',
  cancelButton: '[data-test="cancel"], button[aria-label*="Cancel"]',

  // record form modal
  recordFormModal: '[data-test="record-form-modal"], [role="dialog"]',

  // loading states
  loadingSpinner: '[data-test="loading"], .loading-spinner',
  emptyState: '[data-test="empty-state"], .empty-state',

  // error states
  errorMessage: '[data-test="error"], .error-message',

  // dnssec section (on /dns/dnssec page)
  // .note = toggle is a checkbox input with data-toggle-input="true"
  // .note = status determined by input value attribute ("true" or "false")
  dnssecSection: '[data-test="dnssec"], .dnssec-section',
  dnssecToggle: 'input[data-toggle-input="true"]',
  dnssecToggleLabel: 'label:has(input[data-toggle-input="true"])',
  dnssecStatus: '[data-test="dnssec-status"], .dnssec-status',
  dnssecEnabledIndicator: '.dnssec-enabled, [data-dnssec="enabled"]',

  // dnssec confirmation modal (appears when dnssec toggle is clicked)
  // .note = modal asks "Turn off DNS Security Extensions?"
  dnssecConfirmModal: '[data-testid="confirm-btn"]',
  dnssecConfirmButton: '[data-testid="confirm-btn"]',
  dnssecCancelButton: '[data-testid="cancel-btn"]',
};
