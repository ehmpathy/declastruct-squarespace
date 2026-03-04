import type { Page } from 'playwright';

import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { handleReauthentication } from '../auth/handleReauthentication';
import { dnsSettingsSelectors } from '../selectors/dnsSettingsSelectors';

/**
 * .what = input shape for adding a DNS record
 * .why = explicit contract for record creation
 */
export interface AddDnsRecordInput {
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV';
  host: string;
  value: string;
  ttl?: string;
  priority?: string;
}

/**
 * .what = adds a DNS record to the domain
 * .why = enables programmatic DNS record management for domain transfers
 * .note = may require reauthentication for sensitive operations
 */
export const addDnsRecord = async (input: {
  page: Page;
  domain: string;
  record: AddDnsRecordInput;
  credentials: ContextSquarespaceAgentOptions['credentials'];
}): Promise<{ success: boolean; error: string | null }> => {
  const { page, domain, record, credentials } = input;

  // navigate to dns settings page
  await page.goto(`https://account.squarespace.com/domains/${domain}/dns`);
  await page.waitForLoadState('networkidle');

  // click add record button
  const addButton = await page.$(dnsSettingsSelectors.addRecordButton);
  if (!addButton) {
    return { success: false, error: 'add record button not found' };
  }

  await addButton.click();
  await page.waitForLoadState('networkidle');

  // wait for form modal to appear
  await page.waitForSelector(dnsSettingsSelectors.recordFormModal, {
    timeout: 10000,
  });

  // handle potential reauthentication
  await handleReauthentication(page, credentials);

  // select record type
  const typeSelect = await page.$(dnsSettingsSelectors.recordTypeSelect);
  if (typeSelect) {
    await typeSelect.selectOption(record.type);
  }

  // fill host field
  const hostInput = await page.$(dnsSettingsSelectors.hostInput);
  if (hostInput) {
    await hostInput.fill(record.host);
  }

  // fill value field
  const valueInput = await page.$(dnsSettingsSelectors.valueInput);
  if (valueInput) {
    await valueInput.fill(record.value);
  }

  // set ttl if provided
  if (record.ttl) {
    const ttlSelect = await page.$(dnsSettingsSelectors.ttlSelect);
    if (ttlSelect) {
      await ttlSelect.selectOption(record.ttl);
    }
  }

  // set priority if provided (for MX records)
  if (record.priority) {
    const priorityInput = await page.$(dnsSettingsSelectors.priorityInput);
    if (priorityInput) {
      await priorityInput.fill(record.priority);
    }
  }

  // click save button
  const saveButton = await page.$(dnsSettingsSelectors.saveRecordButton);
  if (!saveButton) {
    return { success: false, error: 'save button not found' };
  }

  await saveButton.click();
  await page.waitForLoadState('networkidle');

  // check for error message
  const errorElement = await page.$(dnsSettingsSelectors.errorMessage);
  if (errorElement) {
    const errorText = await errorElement.textContent();
    return { success: false, error: errorText?.trim() ?? 'unknown error' };
  }

  // wait for modal to close
  await page.waitForTimeout(1000);
  const modalStillVisible = await page
    .$(dnsSettingsSelectors.recordFormModal)
    .then((el) => el !== null);

  if (modalStillVisible) {
    return { success: false, error: 'form did not close after save' };
  }

  return { success: true, error: null };
};
