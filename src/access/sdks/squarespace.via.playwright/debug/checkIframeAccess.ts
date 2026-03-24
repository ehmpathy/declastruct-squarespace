/**
 * .what - debug tool to check if iframe TOTP input is accessible
 * .why - verify frameLocator works for cross-origin iframe
 */

import * as fs from 'fs';
import { chromium } from 'playwright';

const main = async () => {
  const wsEndpoint =
    process.env.BROWSER_WS_ENDPOINT ||
    'ws://localhost:9903/devtools/browser/268feb88-ab91-4b10-b12d-e16ae61232ac';

  const browser = await chromium.connectOverCDP(wsEndpoint);
  const contexts = browser.contexts();
  const context = contexts[0];
  if (!context) {
    console.log('No browser context found');
    await browser.close();
    return;
  }
  const pages = context.pages();

  // find the tab with the reauth modal
  console.log('Total pages:', pages.length);
  for (const page of pages) {
    const url = page.url();
    const hasIframe = await page.$('iframe[src*="reauthenticate"]');
    console.log(`Tab: ${url.slice(0, 60)}... hasReauthIframe=${!!hasIframe}`);
  }

  // find first tab with reauth iframe
  let pageWithModal = null;
  let tabIndex = -1;
  for (let i = 0; i < pages.length; i++) {
    const currentPage = pages[i];
    if (!currentPage) continue;
    const hasIframe = await currentPage.$('iframe[src*="reauthenticate"]');
    if (hasIframe) {
      pageWithModal = currentPage;
      tabIndex = i;
      break;
    }
  }

  if (!pageWithModal) {
    console.log('No tab found with reauth modal');
    await browser.close();
    return;
  }

  console.log(`\nFound reauth modal on tab ${tabIndex}`);
  const page = pageWithModal;

  // take screenshot
  fs.mkdirSync('.cache/browser.default/debug-reauth', { recursive: true });
  await page.screenshot({
    path: '.cache/browser.default/debug-reauth/screenshot.png',
  });
  console.log(
    'Screenshot saved to .cache/browser.default/debug-reauth/screenshot.png',
  );

  console.log('Current URL:', page.url());

  // Check for iframe
  const iframeSelector = 'iframe[src*="reauthenticate"]';
  const iframeElement = await page.$(iframeSelector);
  console.log('Iframe found:', !!iframeElement);

  if (iframeElement) {
    // Try frameLocator
    const reauthIframe = page.frameLocator(iframeSelector);

    // Check for TOTP input selectors
    const totpSelectors = [
      'input[name="code"]',
      'input[placeholder*="XXX"]',
      'input[autocomplete="one-time-code"]',
      'input[inputmode="numeric"]',
    ];

    for (const sel of totpSelectors) {
      try {
        const count = await reauthIframe.locator(sel).count();
        console.log(`Selector '${sel}' count: ${count}`);
      } catch (e) {
        console.log(`Selector '${sel}' error: ${(e as Error).message}`);
      }
    }

    // Try to get any input
    try {
      const allInputs = await reauthIframe.locator('input').count();
      console.log('Total inputs in iframe:', allInputs);
    } catch (e) {
      console.log('Error counting inputs:', (e as Error).message);
    }

    // Try submit button
    try {
      const submitBtn = await reauthIframe
        .locator('button[type="submit"], button:has-text("Verify")')
        .count();
      console.log('Submit buttons in iframe:', submitBtn);
    } catch (e) {
      console.log('Submit button error:', (e as Error).message);
    }

    // Get iframe src
    const src = await iframeElement.getAttribute('src');
    console.log('Iframe src:', src);

    // Check for error messages
    try {
      const errorText = await reauthIframe
        .locator(
          '[class*="error"], [data-test*="error"], p:has-text("invalid"), p:has-text("incorrect")',
        )
        .first()
        .textContent();
      console.log('Error message found:', errorText);
    } catch {
      console.log('No error message visible');
    }

    // Get the TOTP input value to see if it was filled
    try {
      const inputValue = await reauthIframe
        .locator('input[placeholder*="XXX"]')
        .inputValue();
      console.log('TOTP input value:', inputValue || '(empty)');
    } catch (e) {
      console.log('Could not read TOTP input:', (e as Error).message);
    }

    // Get all visible text in iframe body
    try {
      const bodyText = await reauthIframe.locator('body').textContent();
      console.log('Iframe body text:', bodyText?.slice(0, 500));
    } catch (e) {
      console.log('Could not read iframe body:', (e as Error).message);
    }
  }

  await browser.close();
};

main().catch(console.error);
