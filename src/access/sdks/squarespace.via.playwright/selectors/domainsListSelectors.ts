/**
 * .what - CSS selectors for Squarespace domains list page
 * .why - Centralizes selectors for maintainability
 * .note - selectors derived from actual HTML at account.squarespace.com/domains (Mar 2026)
 */
export const domainsListSelectors = {
  /**
   * .what - container for domain list table
   * .why - wait for this to confirm page loaded
   */
  container: '[data-test="domains-table"], table',

  /**
   * .what - row with domain data
   * .why - iterate over these to extract each domain
   * .note - actual selector: tr[data-testid="domains-table-row"]
   */
  domainRow: 'tr[data-testid="domains-table-row"]',

  /**
   * .what - domain name within a row
   * .why - extract the domain name text
   * .note - actual link: a[href*="/domains/managed/"]
   */
  domainName: 'a[href*="/domains/managed/"]',

  /**
   * .what - status badge (Active, Expired, etc)
   * .why - extract domain status
   * .note - status is in second td, inside a span
   */
  domainStatus: 'td:nth-child(2) span',

  /**
   * .what - expiration date
   * .why - extract when domain expires
   * .note - date is in last td, inside a p element
   */
  domainExpiry: 'td:last-child p',

  /**
   * .what - renewal indicator icon in expiration column
   * .why - detect auto-renewal status from list page
   * .note - circular refresh icon with aria-describedby that includes "renews-tooltip"
   */
  renewalIndicator: 'button[aria-describedby*="renews-tooltip"]',

  /**
   * .what - load indicator
   * .why - wait for content to finish load
   */
  loadSpinner: '[aria-busy="true"], [class*="spinner"]',

  /**
   * .what - empty state when no domains
   * .why - detect accounts with no domains
   */
  emptyState: '[class*="empty"], [data-test="empty-state"]',

  /**
   * .what - pagination controls
   * .why - navigate through domain list pages
   */
  nextPageButton: 'button[aria-label="Next page"]',
  previousPageButton: 'button[aria-label="Previous page"]',
};
