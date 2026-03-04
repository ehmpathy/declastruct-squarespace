/**
 * .what - CSS selectors for Squarespace domains list page
 * .why - Centralizes selectors for maintainability
 */
export const domainsListSelectors = {
  // domains list page container
  container: '[data-test="domains-list"], .domains-list',

  // individual domain row
  domainRow: '[data-test="domain-row"], .domain-row',
  domainRowByName: (domain: string) =>
    `[data-test="domain-row"][data-domain="${domain}"], .domain-row[data-domain="${domain}"]`,

  // domain row elements
  domainName: '[data-test="domain-name"], .domain-name',
  domainStatus: '[data-test="domain-status"], .domain-status',
  domainExpiry: '[data-test="domain-expiry"], .domain-expiry',

  // actions
  addDomainButton: '[data-test="add-domain"], button[aria-label*="Add domain"]',
  domainSettingsLink:
    '[data-test="domain-settings"], a[href*="/domains/"][href*="/settings"]',

  // loading states
  loadingSpinner: '[data-test="loading"], .loading-spinner',
  emptyState: '[data-test="empty-state"], .empty-state',

  // pagination
  nextPageButton: '[data-test="next-page"], button[aria-label*="Next"]',
  previousPageButton: '[data-test="prev-page"], button[aria-label*="Previous"]',
};
