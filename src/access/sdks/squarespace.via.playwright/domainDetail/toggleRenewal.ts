import type { Page } from 'playwright';

import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { handleReauthentication } from '../auth/handleReauthentication';
import { waitForSquarespaceReactRender } from '../navigation/waitForSquarespaceReactRender';
import { domainDetailSelectors } from '../selectors/domainDetailSelectors';

/**
 * .what = toggles auto-renewal status (enabled/disabled)
 * .why = controls whether domain will auto-renew or expire at expiration date
 * .note = idempotent - no-op if already in target state
 */
export const toggleRenewal = async (input: {
  page: Page;
  domain: string;
  targetState: 'ENABLED' | 'DISABLED';
  credentials: ContextSquarespaceAgentOptions['credentials'];
}): Promise<{
  success: boolean;
  newState: 'ENABLED' | 'DISABLED';
  wasNoOp: boolean;
}> => {
  const { page, domain, targetState, credentials } = input;

  // navigate to domain overview page (where renewal toggle lives)
  await page.goto(`https://account.squarespace.com/domains/managed/${domain}`);
  await page.waitForLoadState('load');

  // wait for React to fully hydrate before any interaction
  await waitForSquarespaceReactRender({
    page,
    forContent: domainDetailSelectors.container,
  });

  // wait for renewal toggle to appear
  await page.waitForSelector(domainDetailSelectors.renewalToggleInput, {
    timeout: 10000,
  });

  // check current renewal status via checkbox checked property
  const renewalInput = page.locator(domainDetailSelectors.renewalToggleInput);
  const isCurrentlyEnabled = await renewalInput.isChecked();

  // determine if toggle is needed
  const needsToggle =
    (targetState === 'ENABLED' && !isCurrentlyEnabled) ||
    (targetState === 'DISABLED' && isCurrentlyEnabled);

  // if already in target state, return early (idempotent no-op)
  if (!needsToggle) {
    return {
      success: true,
      newState: targetState,
      wasNoOp: true,
    };
  }

  // click the renewal toggle checkbox
  await renewalInput.click();

  // handle potential reauthentication
  await handleReauthentication(page, credentials);

  // handle confirmation modal (may appear when renewal state changes)
  const confirmButton = page.locator(
    domainDetailSelectors.renewalConfirmButton,
  );
  const hasConfirmModal = await confirmButton
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  if (hasConfirmModal) {
    await confirmButton.click();
    // wait for modal to close and state to persist
    await confirmButton
      .waitFor({ state: 'hidden', timeout: 5000 })
      .catch(() => {});
  }

  // wait for state to update
  await page.waitForTimeout(1000);

  // verify new state via checkbox checked property
  const isNowEnabled = await renewalInput.isChecked();

  return {
    success: isNowEnabled === (targetState === 'ENABLED'),
    newState: isNowEnabled ? 'ENABLED' : 'DISABLED',
    wasNoOp: false,
  };
};
