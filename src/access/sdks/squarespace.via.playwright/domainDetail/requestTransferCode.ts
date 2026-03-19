import type { Page } from 'playwright';

import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { handleReauthentication } from '../auth/handleReauthentication';
import { transfersListSelectors } from '../selectors/transfersListSelectors';

/**
 * .what = requests an authorization/transfer code for domain transfer
 * .why = auth code is required to transfer domain to another registrar
 * .note = squarespace sends the code via email, this triggers that process
 */
export const requestTransferCode = async (input: {
  page: Page;
  domain: string;
  credentials: ContextSquarespaceAgentOptions['credentials'];
}): Promise<{
  success: boolean;
  transferCode: string | null;
  emailSent: boolean;
}> => {
  const { page, domain, credentials } = input;

  // navigate to domain transfer page
  await page.goto(`https://account.squarespace.com/domains/${domain}/transfer`);
  await page.waitForLoadState('networkidle');

  // try to find the request code button (try multiple selectors)
  const requestButton =
    (await page.$(transfersListSelectors.requestCodeButton)) ??
    (await page.$(transfersListSelectors.generateAuthCodeButton));

  // if still not found, try reveal button first
  const revealButton = await page.$(
    transfersListSelectors.revealAuthCodeButton,
  );
  if (revealButton) {
    await revealButton.click();
    await page.waitForLoadState('networkidle');

    // handle reauthentication
    await handleReauthentication(page, credentials);

    // check if code is now visible
    const codeElement = await page.$(
      transfersListSelectors.transferCodeDisplay,
    );
    if (codeElement) {
      const code = await codeElement.textContent();
      return {
        success: true,
        transferCode: code?.trim() ?? null,
        emailSent: false,
      };
    }
  }

  // click request/generate button
  if (requestButton) {
    await requestButton.click();
    await page.waitForLoadState('networkidle');

    // handle reauthentication (sensitive operation)
    await handleReauthentication(page, credentials);

    // check for confirmation dialog
    const confirmButton = await page.$(
      transfersListSelectors.confirmTransferButton,
    );
    if (confirmButton) {
      await confirmButton.click();
      await page.waitForLoadState('networkidle');
    }

    // wait for success message or code display
    // .note - fixed timeout because success elements vary by registrar
    // .todo - replace with waitForSelector for known success indicators
    await page.waitForTimeout(3000);

    // check if code is displayed directly
    const codeElement = await page.$(
      transfersListSelectors.transferCodeDisplay,
    );
    if (codeElement) {
      const code = await codeElement.textContent();
      return {
        success: true,
        transferCode: code?.trim() ?? null,
        emailSent: false,
      };
    }

    // check if email was sent
    const emailSentElement = await page.$(
      transfersListSelectors.emailSentMessage,
    );
    const successElement = await page.$(transfersListSelectors.successMessage);

    if (emailSentElement || successElement) {
      return {
        success: true,
        transferCode: null,
        emailSent: true,
      };
    }
  }

  // check if transfer code is already visible
  const codeElementExtant = await page.$(transfersListSelectors.authCodeValue);
  if (codeElementExtant) {
    const code = await codeElementExtant.textContent();
    return {
      success: true,
      transferCode: code?.trim() ?? null,
      emailSent: false,
    };
  }

  return {
    success: false,
    transferCode: null,
    emailSent: false,
  };
};
