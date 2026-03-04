import type { Page } from 'playwright';

import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { handleReauthentication } from '../auth/handleReauthentication';
import { dnsSettingsSelectors } from '../selectors/dnsSettingsSelectors';

/**
 * .what = deletes a DNS record by matching type, host, and value
 * .why = enables programmatic cleanup of DNS records during domain transfers
 * .note = may require reauthentication for sensitive operations
 */
export const deleteDnsRecord = async (input: {
  page: Page;
  domain: string;
  recordMatch: {
    type: string;
    host: string;
    value?: string;
  };
  credentials: ContextSquarespaceAgentOptions['credentials'];
}): Promise<{ success: boolean; error: string | null }> => {
  const { page, domain, recordMatch, credentials } = input;

  // navigate to dns settings page
  await page.goto(`https://account.squarespace.com/domains/${domain}/dns`);
  await page.waitForLoadState('networkidle');

  // wait for records table
  const tableVisible = await page
    .$(dnsSettingsSelectors.recordsTable)
    .then((el) => el !== null);

  if (!tableVisible) {
    return { success: false, error: 'dns records table not found' };
  }

  // find matching record row
  const recordRows = await page.$$(dnsSettingsSelectors.recordRow);
  let targetRow = null;

  for (const row of recordRows) {
    // extract record fields
    const typeElement = await row.$(dnsSettingsSelectors.recordType);
    const hostElement = await row.$(dnsSettingsSelectors.recordHost);
    const valueElement = await row.$(dnsSettingsSelectors.recordValue);

    const type = typeElement ? await typeElement.textContent() : '';
    const host = hostElement ? await hostElement.textContent() : '';
    const value = valueElement ? await valueElement.textContent() : '';

    // check if this row matches
    const typeMatches =
      (type ?? '').trim().toLowerCase() === recordMatch.type.toLowerCase();
    const hostMatches =
      (host ?? '').trim().toLowerCase() === recordMatch.host.toLowerCase();
    const valueMatches = recordMatch.value
      ? (value ?? '').trim().toLowerCase() === recordMatch.value.toLowerCase()
      : true;

    if (typeMatches && hostMatches && valueMatches) {
      targetRow = row;
      break;
    }
  }

  if (!targetRow) {
    return { success: false, error: 'matching record not found' };
  }

  // click delete button on the row
  const deleteButton = await targetRow.$(
    dnsSettingsSelectors.deleteRecordButton,
  );
  if (!deleteButton) {
    return { success: false, error: 'delete button not found on record row' };
  }

  await deleteButton.click();
  await page.waitForLoadState('networkidle');

  // handle potential reauthentication
  await handleReauthentication(page, credentials);

  // look for confirmation dialog
  const confirmModal = await page.$('[role="alertdialog"], [role="dialog"]');
  if (confirmModal) {
    // find and click confirm button
    const confirmButton = await confirmModal.$(
      'button:has-text("Confirm"), button:has-text("Delete"), button[type="submit"]',
    );
    if (confirmButton) {
      await confirmButton.click();
      await page.waitForLoadState('networkidle');
    }
  }

  // wait for record to be removed
  await page.waitForTimeout(2000);

  // verify record was deleted by checking if it's still present
  const recordRowsAfter = await page.$$(dnsSettingsSelectors.recordRow);
  for (const row of recordRowsAfter) {
    const typeElement = await row.$(dnsSettingsSelectors.recordType);
    const hostElement = await row.$(dnsSettingsSelectors.recordHost);
    const valueElement = await row.$(dnsSettingsSelectors.recordValue);

    const type = typeElement ? await typeElement.textContent() : '';
    const host = hostElement ? await hostElement.textContent() : '';
    const value = valueElement ? await valueElement.textContent() : '';

    const typeMatches =
      (type ?? '').trim().toLowerCase() === recordMatch.type.toLowerCase();
    const hostMatches =
      (host ?? '').trim().toLowerCase() === recordMatch.host.toLowerCase();
    const valueMatches = recordMatch.value
      ? (value ?? '').trim().toLowerCase() === recordMatch.value.toLowerCase()
      : true;

    if (typeMatches && hostMatches && valueMatches) {
      return { success: false, error: 'record still present after delete' };
    }
  }

  return { success: true, error: null };
};
