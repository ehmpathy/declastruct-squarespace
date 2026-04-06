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
  // .note = nameservers page has h2 "Domain Nameservers" and list of NS values
  // .note = ul with nameserver list is adjacent to div with h2
  // .note = each nameserver is in li > div > div > p structure
  // .note = sidebar nav (sticky-nav-container) has similar structure, must filter in code
  nameserversSection:
    'h2:has-text("Domain Nameservers"), [data-testid="nameservers"]',
  nameserverRow: 'ul li:has(div div p)',
  nameserverValue: 'ul li div div p',
  editNameserversButton:
    'button:has-text("Use custom nameservers"), button:has-text("Update Nameservers"), [data-testid="edit-nameservers"]',

  // nameserver edit modal
  // .note = modal appears after edit button click; contains custom NS inputs
  nameserverEditModal: '[role="dialog"], [data-testid="nameserver-edit-modal"]',
  customNameserverInputs:
    '[role="dialog"] input[type="text"], [data-testid="custom-nameserver-input"], [role="dialog"] input[name*="nameserver"]',
  saveNameserversButton:
    '[role="dialog"] button:has-text("Save"), [role="dialog"] button:has-text("SAVE"), [data-testid="save-nameservers"]',
  // page-level button to reset to squarespace nameservers (NOT in modal)
  useSquarespaceNameserversButton:
    'button:has-text("Use Squarespace nameservers"), [data-testid="use-squarespace-nameservers"]',

  // reset nameservers confirmation dialog
  // .note = appears after click on "Use Squarespace nameservers" when custom NS are set
  resetNameserversConfirmModal:
    '[role="dialog"]:has-text("custom nameservers will be discarded"), [role="alertdialog"]:has-text("custom nameservers")',
  resetNameserversConfirmButton:
    '[role="dialog"] button:has-text("CONTINUE"), [role="alertdialog"] button:has-text("CONTINUE")',

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
    '[role="dialog"] button:has-text("OK"), [role="alertdialog"] button:has-text("OK"), [role="dialog"] button:has-text("Got it"), [role="dialog"] button:has-text("GOT IT"), [role="dialog"] button:has-text("Done"), [role="dialog"] button:has-text("DONE"), button:has-text("OK")',
  transferCodeSendButton:
    '[data-testid="sendauthcode-button"], button:has-text("SEND AUTH CODE"), button:has-text("Send auth code")',

  // renewal toggle
  // .note = auto-renew toggle is in the domain overview page, under "Renews On" section
  renewalToggleInput: 'input[aria-labelledby="auto-renew-toggle-label"]',
  renewalToggleLabel: '#auto-renew-toggle-label',
  renewalConfirmButton:
    '[data-testid="confirm-btn"], button:has-text("CONFIRM"), button:has-text("Confirm")',
  renewalConfirmModal:
    '[role="dialog"]:has-text("renewal"), [role="dialog"]:has-text("auto-renew"), [role="alertdialog"]:has-text("renewal")',

  // load states (external API requirement)
  loadingSpinner: '[data-testid="loading"], .loading-spinner',
};
