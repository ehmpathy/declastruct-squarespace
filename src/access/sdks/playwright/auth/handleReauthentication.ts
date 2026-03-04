import type { Page } from 'playwright';

import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { authSelectors } from './selectors';

/**
 * .what - Detect and handle reauthentication modal if present
 * .why - Squarespace may prompt for password during sensitive operations
 */
export const handleReauthentication = async (
  page: Page,
  credentials: ContextSquarespaceAgentOptions['credentials'],
): Promise<boolean> => {
  // check if reauth modal is present
  const reauthModal = await page.$(authSelectors.reauthModal.container);
  if (!reauthModal) return false;

  // enter password in reauth modal
  await page.fill(
    authSelectors.reauthModal.passwordInput,
    credentials.password,
  );

  // submit reauth form
  await page.click(authSelectors.reauthModal.submitButton);
  await page.waitForLoadState('networkidle');

  // verify modal is dismissed
  await page.waitForSelector(authSelectors.reauthModal.container, {
    state: 'hidden',
    timeout: 5000,
  });

  return true;
};

/**
 * .what - Check if reauthentication is required on current page
 * .why - Enables proactive detection before attempting sensitive actions
 */
export const isReauthenticationRequired = async (
  page: Page,
): Promise<boolean> => {
  const reauthModal = await page.$(authSelectors.reauthModal.container);
  return reauthModal !== null;
};
