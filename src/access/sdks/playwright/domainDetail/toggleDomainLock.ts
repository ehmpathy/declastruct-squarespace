import type { Page } from 'playwright';

import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { handleReauthentication } from '../auth/handleReauthentication';
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
}): Promise<{ success: boolean; newState: 'locked' | 'unlocked' }> => {
  const { page, domain, targetState, credentials } = input;

  // navigate to domain detail page
  await page.goto(`https://account.squarespace.com/domains/${domain}/overview`);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector(domainDetailSelectors.container, {
    timeout: 30000,
  });

  // check current lock status
  const lockStatusElement = await page.$(domainDetailSelectors.lockStatus);
  const lockStatusText = lockStatusElement
    ? await lockStatusElement.textContent()
    : '';
  const isCurrentlyLocked =
    lockStatusText?.toLowerCase().includes('locked') &&
    !lockStatusText?.toLowerCase().includes('unlocked');

  // determine if toggle is needed
  const needsToggle =
    (targetState === 'locked' && !isCurrentlyLocked) ||
    (targetState === 'unlocked' && isCurrentlyLocked);

  // if already in target state, return early
  if (!needsToggle) {
    return {
      success: true,
      newState: targetState,
    };
  }

  // click the lock toggle
  const toggleButton = await page.$(domainDetailSelectors.lockToggle);
  if (!toggleButton) {
    return {
      success: false,
      newState: isCurrentlyLocked ? 'locked' : 'unlocked',
    };
  }

  await toggleButton.click();
  await page.waitForLoadState('networkidle');

  // handle potential reauthentication (sensitive operation)
  await handleReauthentication(page, credentials);

  // wait for state to update
  await page.waitForTimeout(2000);

  // verify new state
  const newLockStatusElement = await page.$(domainDetailSelectors.lockStatus);
  const newLockStatusText = newLockStatusElement
    ? await newLockStatusElement.textContent()
    : '';
  const isNowLocked =
    newLockStatusText?.toLowerCase().includes('locked') &&
    !newLockStatusText?.toLowerCase().includes('unlocked');

  return {
    success: isNowLocked === (targetState === 'locked'),
    newState: isNowLocked ? 'locked' : 'unlocked',
  };
};
