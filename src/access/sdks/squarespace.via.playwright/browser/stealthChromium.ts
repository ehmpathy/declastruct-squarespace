import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

/**
 * .what - chromium instance with stealth plugin applied
 * .why - centralized stealth config; plugin should only be applied once
 * .note - masks automation signals: navigator.webdriver, HeadlessChrome user agent
 */
chromium.use(StealthPlugin());

export { chromium as stealthChromium };
