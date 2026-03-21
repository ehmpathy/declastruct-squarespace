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
    codeInput:
      'input[name="code"], input[placeholder*="Authentication"], input[autocomplete="one-time-code"], input[inputmode="numeric"]',
    rememberDevice:
      'input[type="checkbox"], label:has-text("Remember"), [data-test="remember-device"]',
    submitButton: 'button[type="submit"]',
    errorMessage: '[data-test="totp-error"]',
  },

  // SMS 2FA page (not supported)
  sms2faPage: {
    // indicators that SMS 2FA was requested
    container:
      '[data-test="sms-verification"], [data-test="phone-verification"]',
    phoneInput: 'input[type="tel"], input[name="phone"]',
    sendCodeButton: 'button:has-text("Send"), button:has-text("Text me")',
  },

  // Passkey 2FA page (not supported)
  passkey2faPage: {
    // indicators that passkey/security key was requested
    container: '[data-test="passkey-verification"], [data-test="security-key"]',
    usePasskeyButton:
      'button:has-text("Use passkey"), button:has-text("Security key")',
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
