import type { Page } from 'playwright';

import { emitBrowserMovieFrame } from '@src/_topublish/kermet/emitBrowserMovieFrame';
import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { handleReauthentication } from '../auth/handleReauthentication';
import { waitForSquarespaceReactRender } from '../navigation/waitForSquarespaceReactRender';
import { domainDetailSelectors } from '../selectors/domainDetailSelectors';

/**
 * .what = toggles the domain lock status (locked/unlocked)
 * .why = domains must be unlocked before transfer can be initiated
 * .note = idempotent - no-op if already in target state
 */
export const toggleDomainLock = async (input: {
  page: Page;
  domain: string;
  targetState: 'locked' | 'unlocked';
  credentials: ContextSquarespaceAgentOptions['credentials'];
}): Promise<{
  success: boolean;
  newState: 'locked' | 'unlocked';
  wasNoOp: boolean;
}> => {
  const { page, domain, targetState, credentials } = input;
  const targetUrl = `https://account.squarespace.com/domains/managed/${domain}`;

  // navigate to domain detail page only if not already there
  if (!page.url().includes(`/domains/managed/${domain}`)) {
    await page.goto(targetUrl);
    await page.waitForLoadState('load');
  }

  // wait for React to fully hydrate before any interaction
  await waitForSquarespaceReactRender({
    page,
    forContent: '[data-testid="domain-lock-toggle"]',
  });
  await emitBrowserMovieFrame({ page, frame: { name: 'toggle-lock-ready' } });

  // check current lock status via checkbox state
  // .note = checkbox `checked` property is more reliable than status text parse
  const lockToggleInput = await page.$(domainDetailSelectors.lockToggleInput);
  const isCurrentlyLocked = lockToggleInput
    ? await lockToggleInput.isChecked()
    : false;

  // determine if toggle is needed
  const needsToggle =
    (targetState === 'locked' && !isCurrentlyLocked) ||
    (targetState === 'unlocked' && isCurrentlyLocked);

  // if already in target state, return early (idempotent no-op)
  if (!needsToggle) {
    return {
      success: true,
      newState: targetState,
      wasNoOp: true,
    };
  }

  // click the lock toggle label
  // .note = click label element (data-testid) since input may be visually hidden
  const toggleLabel = page
    .locator('[data-testid="domain-lock-toggle"]')
    .first();
  const toggleLabelVisible = await toggleLabel.isVisible();
  if (!toggleLabelVisible) {
    return {
      success: false,
      newState: isCurrentlyLocked ? 'locked' : 'unlocked',
      wasNoOp: false,
    };
  }

  await toggleLabel.click();

  // handle unlock confirmation modal if it appears
  // .note = squarespace shows "Unlock domain?" modal when unlock is requested
  const unlockConfirmModal = await page.$(
    domainDetailSelectors.unlockConfirmModal,
  );
  if (unlockConfirmModal) {
    // wait for confirm button to be visible
    await page.waitForSelector(domainDetailSelectors.unlockConfirmButton, {
      timeout: 5000,
    });
    await page.click(domainDetailSelectors.unlockConfirmButton);
    await page.waitForTimeout(2000);
  } else {
    await page.waitForTimeout(2000);
  }

  // handle potential reauthentication (sensitive operation)
  await handleReauthentication(page, credentials);

  // wait for state to update
  await page.waitForTimeout(2000);

  // verify new state via checkbox state
  const newLockToggleInput = await page.$(
    domainDetailSelectors.lockToggleInput,
  );
  const isNowLocked = newLockToggleInput
    ? await newLockToggleInput.isChecked()
    : false;

  return {
    success: isNowLocked === (targetState === 'locked'),
    newState: isNowLocked ? 'locked' : 'unlocked',
    wasNoOp: false,
  };
};
