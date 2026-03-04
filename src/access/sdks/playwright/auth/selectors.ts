/**
 * .what - CSS selectors for Squarespace authentication pages
 * .why - Centralizes selectors for maintainability
 */
export const authSelectors = {
  // Login page
  loginPage: {
    emailInput: 'input[name="email"]',
    passwordInput: 'input[name="password"]',
    submitButton: 'button[type="submit"]',
    errorMessage: '[data-test="login-error"]',
  },

  // 2FA/TOTP page
  totpPage: {
    codeInput: 'input[name="code"]',
    submitButton: 'button[type="submit"]',
    errorMessage: '[data-test="totp-error"]',
  },

  // Reauthentication modal/popup
  reauthModal: {
    container: '[data-test="reauth-modal"], [role="dialog"]',
    passwordInput: 'input[name="password"], input[type="password"]',
    submitButton: 'button[type="submit"]',
    cancelButton: 'button[data-test="cancel"]',
  },

  // Logged in indicators
  loggedIn: {
    accountMenu: '[data-test="account-menu"]',
    domainsLink: 'a[href*="/domains"]',
  },
};
