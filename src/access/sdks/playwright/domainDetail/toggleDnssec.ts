import type { Page } from 'playwright';

import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { handleReauthentication } from '../auth/handleReauthentication';

/**
 * .what = selectors specific to DNSSEC settings
 * .why = centralizes dnssec-related selectors
 */
const dnssecSelectors = {
  dnssecSection: '[data-test="dnssec"], .dnssec-section',
  dnssecToggle: '[data-test="dnssec-toggle"], button[aria-label*="DNSSEC"]',
  dnssecStatus: '[data-test="dnssec-status"], .dnssec-status',
  enabledIndicator: '.dnssec-enabled, [data-dnssec="enabled"]',
};

/**
 * .what = toggles DNSSEC status (enabled/disabled)
 * .why = dnssec must be disabled before domain transfer to avoid issues
 * .note = idempotent - no-op if already in target state
 */
export const toggleDnssec = async (input: {
  page: Page;
  domain: string;
  targetState: 'enabled' | 'disabled';
  credentials: ContextSquarespaceAgentOptions['credentials'];
}): Promise<{ success: boolean; newState: 'enabled' | 'disabled' }> => {
  const { page, domain, targetState, credentials } = input;

  // navigate to domain dns settings page
  await page.goto(`https://account.squarespace.com/domains/${domain}/dns`);
  await page.waitForLoadState('networkidle');

  // check current dnssec status
  const dnssecStatusElement = await page.$(dnssecSelectors.dnssecStatus);
  const dnssecStatusText = dnssecStatusElement
    ? await dnssecStatusElement.textContent()
    : '';
  const enabledIndicator = await page.$(dnssecSelectors.enabledIndicator);
  const isCurrentlyEnabled =
    enabledIndicator !== null ||
    dnssecStatusText?.toLowerCase().includes('enabled');

  // determine if toggle is needed
  const needsToggle =
    (targetState === 'enabled' && !isCurrentlyEnabled) ||
    (targetState === 'disabled' && isCurrentlyEnabled);

  // if already in target state, return early
  if (!needsToggle) {
    return {
      success: true,
      newState: targetState,
    };
  }

  // click the dnssec toggle
  const toggleButton = await page.$(dnssecSelectors.dnssecToggle);
  if (!toggleButton) {
    return {
      success: false,
      newState: isCurrentlyEnabled ? 'enabled' : 'disabled',
    };
  }

  await toggleButton.click();
  await page.waitForLoadState('networkidle');

  // handle potential reauthentication
  await handleReauthentication(page, credentials);

  // wait for state to update
  await page.waitForTimeout(2000);

  // verify new state
  const newStatusElement = await page.$(dnssecSelectors.dnssecStatus);
  const newStatusText = newStatusElement
    ? await newStatusElement.textContent()
    : '';
  const newEnabledIndicator = await page.$(dnssecSelectors.enabledIndicator);
  const isNowEnabled =
    newEnabledIndicator !== null ||
    newStatusText?.toLowerCase().includes('enabled');

  return {
    success: isNowEnabled === (targetState === 'enabled'),
    newState: isNowEnabled ? 'enabled' : 'disabled',
  };
};
