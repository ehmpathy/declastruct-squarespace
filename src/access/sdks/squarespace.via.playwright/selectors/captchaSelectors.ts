/**
 * .what - selectors for cloudflare turnstile captcha
 * .why - centralized selectors for captcha detection and interaction
 */
export const CAPTCHA_SELECTORS = {
  /** turnstile iframe with the challenge */
  turnstileIframe: 'iframe[src*="challenges.cloudflare.com"]',

  /** checkbox element inside turnstile iframe */
  turnstileCheckbox: 'input[type="checkbox"], .cb-lb',

  /** challenge page indicator (full-page block) */
  challengePage: 'div[class*="challenge"], #challenge-running',
} as const;
