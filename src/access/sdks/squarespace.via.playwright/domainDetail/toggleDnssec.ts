import type { Page } from 'playwright';

import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { handleReauthentication } from '../auth/handleReauthentication';
import { waitForSquarespaceReactRender } from '../navigation/waitForSquarespaceReactRender';
import { dnsSettingsSelectors } from '../selectors/dnsSettingsSelectors';

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
}): Promise<{
  success: boolean;
  newState: 'enabled' | 'disabled';
  wasNoOp: boolean;
}> => {
  const { page, domain, targetState, credentials } = input;

  // navigate to domain dnssec settings page
  // .note = URL pattern is /domains/managed/${domain}/dns/dnssec (separate page from dns-settings)
  await page.goto(
    `https://account.squarespace.com/domains/managed/${domain}/dns/dnssec`,
  );
  await page.waitForLoadState('load');

  // wait for React to fully hydrate before any interaction
  await waitForSquarespaceReactRender({
    page,
    forContent: dnsSettingsSelectors.dnssecToggle,
  });

  // check current dnssec status via checkbox value attribute
  // .note = squarespace uses value="true"|"false" on the toggle input (NOT the checked property)
  // .note = the checkbox is visually always checked, but value determines actual DNSSEC state
  const toggleInput = await page.$(dnsSettingsSelectors.dnssecToggle);
  const valueAttr = toggleInput ? await toggleInput.getAttribute('value') : '';
  const isCurrentlyEnabled = valueAttr === 'true';

  // determine if toggle is needed
  const needsToggle =
    (targetState === 'enabled' && !isCurrentlyEnabled) ||
    (targetState === 'disabled' && isCurrentlyEnabled);

  // if already in target state, return early (idempotent no-op)
  if (!needsToggle) {
    return {
      success: true,
      newState: targetState,
      wasNoOp: true,
    };
  }

  // click the dnssec toggle input directly
  // .note = input is clickable and triggers the toggle
  const toggleInputLocator = page.locator(dnsSettingsSelectors.dnssecToggle);
  await toggleInputLocator.click();

  // handle potential reauthentication
  await handleReauthentication(page, credentials);

  // handle confirmation modal (appears when dnssec state changes)
  // .note = squarespace shows "Turn off DNS Security Extensions?" modal
  const confirmButton = page.locator(dnsSettingsSelectors.dnssecConfirmButton);
  const hasConfirmModal = await confirmButton
    .isVisible({ timeout: 2000 })
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

  // verify new state via value attribute
  const newToggleInput = await page.$(dnsSettingsSelectors.dnssecToggle);
  const newValueAttr = newToggleInput
    ? await newToggleInput.getAttribute('value')
    : '';
  const isNowEnabled = newValueAttr === 'true';

  return {
    success: isNowEnabled === (targetState === 'enabled'),
    newState: isNowEnabled ? 'enabled' : 'disabled',
    wasNoOp: false,
  };
};
