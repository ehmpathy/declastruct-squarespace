/**
 * .what - CSS selectors for Squarespace domain detail page
 * .why - Centralizes selectors for maintainability
 */
export const domainDetailSelectors = {
  // domain detail page container
  container: '[data-test="domain-detail"], .domain-detail',

  // domain info section
  domainName: '[data-test="domain-name"], h1.domain-name',
  domainStatus: '[data-test="domain-status"], .domain-status',
  registrarInfo: '[data-test="registrar-info"], .registrar-info',
  expirationDate: '[data-test="expiration-date"], .expiration-date',

  // lock status
  lockStatus: '[data-test="lock-status"], .lock-status',
  lockToggle: '[data-test="lock-toggle"], button[aria-label*="Lock"]',
  lockReason: '[data-test="lock-reason"], .lock-reason',

  // nameservers section
  nameserversSection: '[data-test="nameservers"], .nameservers-section',
  nameserverRow: '[data-test="nameserver-row"], .nameserver-row',
  nameserverValue: '[data-test="nameserver-value"], .nameserver-value',
  editNameserversButton:
    '[data-test="edit-nameservers"], button[aria-label*="Edit nameservers"]',

  // whois section
  whoisSection: '[data-test="whois"], .whois-section',
  whoisPrivacyToggle: '[data-test="whois-privacy"], input[type="checkbox"]',

  // navigation tabs
  overviewTab: '[data-test="overview-tab"], a[href*="/overview"]',
  dnsTab: '[data-test="dns-tab"], a[href*="/dns"]',
  transferTab: '[data-test="transfer-tab"], a[href*="/transfer"]',

  // action buttons
  renewButton: '[data-test="renew"], button[aria-label*="Renew"]',
  transferOutButton:
    '[data-test="transfer-out"], button[aria-label*="Transfer"]',

  // loading states
  loadingSpinner: '[data-test="loading"], .loading-spinner',
};
