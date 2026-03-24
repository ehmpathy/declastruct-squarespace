import type { Page } from 'playwright';

import { emitBrowserMovieFrame } from '@src/_topublish/kermet/emitBrowserMovieFrame';
import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { handleReauthentication } from '../auth/handleReauthentication';
import { waitForSquarespaceReactRender } from '../navigation/waitForSquarespaceReactRender';
import { domainDetailSelectors } from '../selectors/domainDetailSelectors';

/**
 * .what = requests an authorization/transfer code for domain transfer
 * .why = auth code is required to transfer domain to another registrar
 * .note = squarespace sends the code via EMAIL, not displayed on page
 * .note = button is on the domain overview page, not a separate transfer page
 * .note = returns success when squarespace confirms code was sent to email
 */
export const requestTransferCode = async (input: {
  page: Page;
  domain: string;
  credentials: ContextSquarespaceAgentOptions['credentials'];
}): Promise<{
  codeSentViaEmail: true;
}> => {
  const { page, domain, credentials } = input;
  const targetUrl = `https://account.squarespace.com/domains/managed/${domain}`;

  // handle any leftover reauth modal from prior operation
  // .note - modal may persist if prior operation failed mid-reauth
  const clearedPriorReauth = await handleReauthentication(page, credentials);
  if (clearedPriorReauth) {
    await emitBrowserMovieFrame({
      page,
      frame: { name: 'cleared-prior-reauth' },
    });
  }

  // navigate to domain overview page only if not already there
  if (!page.url().includes(`/domains/managed/${domain}`)) {
    await page.goto(targetUrl);
    await page.waitForLoadState('load');
  }

  // wait for React to hydrate with target content
  await waitForSquarespaceReactRender({
    page,
    forContent: domainDetailSelectors.requestTransferCodeButton,
  });
  await emitBrowserMovieFrame({ page, frame: { name: 'page-ready' } });

  // click the request transfer code button
  const requestButton = page
    .locator(domainDetailSelectors.requestTransferCodeButton)
    .first();
  await requestButton.click();
  await emitBrowserMovieFrame({
    page,
    frame: { name: 'request-button-clicked' },
  });

  // wait for confirmation dialog or reauth modal
  await page.waitForTimeout(1000);
  await emitBrowserMovieFrame({ page, frame: { name: 'after-request-click' } });

  // handle reauthentication if modal appears
  // .note - reauth may appear before or after SEND AUTH CODE button is visible
  const reauthHandled = await handleReauthentication(page, credentials);
  await emitBrowserMovieFrame({
    page,
    frame: { name: reauthHandled ? 'reauth-done' : 'reauth-skipped' },
  });

  // click "SEND AUTH CODE" button if present (may appear after reauth)
  const sendAuthCodeButton = page
    .locator(domainDetailSelectors.transferCodeSendButton)
    .first();
  const sendButtonVisible = await sendAuthCodeButton
    .isVisible()
    .catch(() => false);
  await emitBrowserMovieFrame({
    page,
    frame: {
      name: sendButtonVisible ? 'send-button-visible' : 'no-send-button',
    },
  });
  if (sendButtonVisible) {
    await sendAuthCodeButton.click();
    await emitBrowserMovieFrame({
      page,
      frame: { name: 'send-auth-code-clicked' },
    });
    // wait for success modal after click
    await page.waitForTimeout(2000);
  }
  await emitBrowserMovieFrame({ page, frame: { name: 'check-success-modal' } });

  // check for success modal "Transfer authorization code sent"
  const successTextLocator = page.locator(
    domainDetailSelectors.transferCodeSuccessText,
  );
  const successModalVisible = await successTextLocator
    .isVisible()
    .catch(() => false);
  await emitBrowserMovieFrame({
    page,
    frame: {
      name: successModalVisible ? 'success-modal-visible' : 'no-success-modal',
    },
  });

  if (successModalVisible) {
    // click OK to dismiss the modal
    const okButton = page
      .locator(domainDetailSelectors.transferCodeOkButton)
      .first();
    await okButton.click();
    await page.waitForTimeout(500);
    await emitBrowserMovieFrame({
      page,
      frame: { name: 'success-modal-dismissed' },
    });
    return { codeSentViaEmail: true };
  }

  // fail fast - success modal not found
  await emitBrowserMovieFrame({ page, frame: { name: 'error-state' } });
  const bodyText = await page.locator('body').textContent();
  throw new Error(
    `requestTransferCode: success modal not found. ` +
      `expected "Transfer authorization code sent" dialog. ` +
      `url=${page.url()}, bodyPreview=${bodyText?.slice(0, 500)}`,
  );
};
