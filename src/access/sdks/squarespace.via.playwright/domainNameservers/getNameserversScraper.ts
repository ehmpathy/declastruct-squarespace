import type { Page } from 'playwright';

import { emitBrowserMovieFrame } from '@src/_topublish/kermet/emitBrowserMovieFrame';

import { waitForSquarespaceReactRender } from '../navigation/waitForSquarespaceReactRender';
import { domainDetailSelectors } from '../selectors/domainDetailSelectors';

/**
 * .what = gets domain nameservers via squarespace UI
 * .why = enables programmatic read of DNS provider configuration
 * .note = navigates to nameservers page to check button visibility
 */
export const getNameserversScraper = async (input: {
  page: Page;
  domain: string;
}): Promise<{
  nameservers: string[] | null;
}> => {
  const { page, domain } = input;
  const targetUrl = `https://account.squarespace.com/domains/managed/${domain}/dns/domain-nameservers`;

  // navigate to nameservers page
  // .note = always reload to ensure fresh content from server
  await page.goto(targetUrl);
  await page.waitForLoadState('load');

  // wait for React to fully hydrate
  await waitForSquarespaceReactRender({
    page,
    forContent: domainDetailSelectors.nameserversSection,
  });
  await emitBrowserMovieFrame({
    page,
    frame: { name: 'get-nameservers-ready' },
  });

  // determine if squarespace default or custom via button visibility
  // .note = squarespace default nameservers are actually googledomains.com, not squarespace.com
  // .note = if "USE SQUARESPACE NAMESERVERS" button is visible, domain has custom NS
  // .note = if "USE CUSTOM NAMESERVERS" button is visible, domain has squarespace default
  const resetButtonVisible = await page
    .locator(domainDetailSelectors.useSquarespaceNameserversButton)
    .first()
    .isVisible();
  const isSquarespaceDefault = !resetButtonVisible;

  // return null for squarespace default
  if (isSquarespaceDefault) {
    return {
      nameservers: null,
    };
  }

  // wait for nameserver values to render
  // .note = page may not have rendered content yet after React hydration
  // .note = poll until at least one element contains a dot (FQDN pattern)
  const maxWaitMs = 10000;
  const pollIntervalMs = 200;
  const startTime = Date.now();
  let fqdnFound = false;

  while (!fqdnFound && Date.now() - startTime < maxWaitMs) {
    const nameserverRows = page.locator(domainDetailSelectors.nameserverValue);
    const rowCount = await nameserverRows.count();
    for (let i = 0; i < rowCount; i++) {
      const text = await nameserverRows.nth(i).textContent();
      if (text && text.includes('.')) {
        fqdnFound = true;
        break;
      }
    }
    if (!fqdnFound) {
      await page.waitForTimeout(pollIntervalMs);
    }
  }

  // read current nameservers for custom NS
  // .note = filter out elements inside sticky-nav-container (sidebar nav has same DOM structure)
  // .note = nameservers contain dots (e.g., ns1.cloudflare.com), nav items don't
  const nameserverRows = page.locator(domainDetailSelectors.nameserverValue);
  const rowCount = await nameserverRows.count();
  const currentNameservers: string[] = [];
  for (let i = 0; i < rowCount; i++) {
    const text = await nameserverRows.nth(i).textContent();
    // filter: nameservers are FQDNs with dots, skip nav items like "Overview", "DNS"
    if (text && text.includes('.')) currentNameservers.push(text.trim());
  }

  return {
    nameservers: currentNameservers,
  };
};
