/**
 * .what - CSS selectors for Squarespace domain detail page
 * .why - Centralizes selectors for maintainability
 * .note - URL pattern is /domains/managed/${domain} (not /domains/${domain}/overview)
 */
export const domainDetailSelectors = {
  // domain detail page container
  container: '[data-test="account-dashboard-page"], .ManagedOverviewPage-n4cm2',

  // domain info section
  domainName: 'h1.css-17bjp01, [data-testid="domain-name"]',
  domainStatus: '.css-rezzxq, [data-testid="domain-status"]',
  registrarInfo: '[data-testid="domain-provider"], p:has-text("Provider")',
  expirationDate: '.css-ey9qic, [data-testid="expiration-date"]',

  // lock status
  lockStatus: '#domain-lock-toggle-label, span:has-text("Lock")',
  lockToggle:
    '[data-testid="domain-lock-toggle"], label:has(input[aria-labelledby="domain-lock-toggle-label"])',
  lockToggleInput:
    '[data-testid="domain-lock-toggle"] input, input[aria-labelledby="domain-lock-toggle-label"]',
  lockReason: '[data-testid="lock-reason"], .lock-reason',

  // nameservers section
  nameserversSection: '[data-testid="nameservers"], .nameservers-section',
  nameserverRow: '[data-testid="nameserver-row"], .nameserver-row',
  nameserverValue: '[data-testid="nameserver-value"], .nameserver-value',
  editNameserversButton:
    '[data-testid="edit-nameservers"], button[aria-label*="Edit nameservers"]',

  // whois section
  whoisSection: '[data-testid="whois"], .whois-section',
  whoisPrivacyToggle:
    '[data-testid="whois-privacy-toggle"], input[aria-labelledby="whois-privacy-toggle-label"]',

  // navigation tabs
  overviewTab:
    'a[href*="/managed/"][href$="/overview"], a:has-text("Overview")',
  dnsTab: 'a[href*="/dns"], a:has-text("DNS")',
  transferTab: 'a[href*="/transfer"], a:has-text("Transfer")',

  // action buttons
  renewButton: 'a:has-text("Add years"), button:has-text("Renew")',
  requestTransferCodeButton:
    'button:has-text("Request transfer code"), button:has-text("Transfer")',
  cancelDomainButton: '[data-testid="canceldomain-button"]',
  moveDomainButton: '[data-testid="move-domain-button"]',

  // unlock confirmation modal
  // .note = appears after lock toggle click to unlock; requires explicit confirm
  unlockConfirmModal: '[data-testid="unlock-domain-confirmation"]',
  unlockConfirmButton: '[data-testid="confirm-btn"]',
  unlockCancelButton: '[data-testid="cancel-btn"]',

  // transfer code request flow
  // .note = squarespace sends code via EMAIL, not displayed on page
  transferCodeSuccessModal:
    '[role="dialog"]:has-text("Transfer authorization code sent"), [role="alertdialog"]:has-text("Transfer authorization code sent")',
  transferCodeSuccessText: 'text="Transfer authorization code sent"',
  transferCodeOkButton:
    '[role="dialog"] button:has-text("OK"), [role="alertdialog"] button:has-text("OK"), button:has-text("OK")',
  transferCodeSendButton:
    '[data-testid="sendauthcode-button"], button:has-text("SEND AUTH CODE"), button:has-text("Send auth code")',

  // load states (external API requirement)
  loadingSpinner: '[data-testid="loading"], .loading-spinner',
};
