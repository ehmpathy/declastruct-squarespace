import { BadRequestError } from 'helpful-errors';
import type { Page } from 'playwright';

/**
 * .what - verify the logged-in email matches expected credentials
 * .why - prevent cache pollution from wrong-account sessions
 *
 * .how - click avatar dropdown (accessible from any page), extract email, compare
 */
export const verifyLoggedInEmail = async (
  page: Page,
  expectedEmail: string,
): Promise<void> => {
  // wait for avatar to be clickable (proof page has rendered)
  await page.waitForSelector('[data-test="avatar"]', {
    timeout: 30000,
  });

  // click avatar to open dropdown
  await page.click('[data-test="avatar"]');

  // wait for dropdown to render (email is second line of text in dropdown)
  await page.waitForTimeout(500);

  // get dropdown content
  const dropdownContent = await page.content();
  const emailMatch = dropdownContent?.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  );

  // find the email that matches expected (case-insensitive)
  const expectedEmailLower = expectedEmail.toLowerCase().trim();
  const loggedInEmail = emailMatch?.find(
    (email) => email.toLowerCase().trim() === expectedEmailLower,
  );

  // if expected email not found, check if different account is logged in
  if (!loggedInEmail) {
    const otherEmail = emailMatch?.[0];
    if (otherEmail) {
      throw new BadRequestError(
        `verifyLoggedInEmail: logged-in email does not match credentials. ` +
          `expected=${expectedEmailLower}, got=${otherEmail.toLowerCase()}. ` +
          `clear browser session: rhx browser.stop && rhx browser.start --mode HEADFUL --refresh`,
        {
          expectedEmail: expectedEmailLower,
          loggedInEmail: otherEmail.toLowerCase(),
        },
      );
    }

    throw new BadRequestError(
      'verifyLoggedInEmail: could not find any email in avatar dropdown',
      {
        url: page.url(),
        dropdownContentPreview: dropdownContent?.slice(0, 500),
      },
    );
  }

  // close dropdown by click elsewhere
  await page.click('body', { position: { x: 10, y: 10 } });

  console.log(`verifyLoggedInEmail: confirmed ${loggedInEmail.toLowerCase()}`);
};
