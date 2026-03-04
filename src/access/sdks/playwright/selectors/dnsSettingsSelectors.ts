/**
 * .what - CSS selectors for Squarespace DNS settings page
 * .why - Centralizes selectors for maintainability
 */
export const dnsSettingsSelectors = {
  // DNS settings page container
  container: '[data-test="dns-settings"], .dns-settings',

  // DNS records table
  recordsTable: '[data-test="dns-records-table"], table.dns-records',
  recordRow: '[data-test="dns-record-row"], tr.dns-record',

  // record row elements
  recordType: '[data-test="record-type"], .record-type',
  recordHost: '[data-test="record-host"], .record-host',
  recordValue: '[data-test="record-value"], .record-value',
  recordTtl: '[data-test="record-ttl"], .record-ttl',
  recordPriority: '[data-test="record-priority"], .record-priority',

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
};
