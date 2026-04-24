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

  // skip navigation if already on nameservers page (preserve fresh state from setNameservers)
  // .note = squarespace has eventual consistency; re-navigation may return stale data
  // .note = when page is already on correct URL, current DOM has the authoritative state
  const currentUrl = page.url();
  const isAlreadyOnPage = currentUrl.includes(
    `/domains/managed/${domain}/dns/domain-nameservers`,
  );
  console.log(
    `[getNameserversScraper] isAlreadyOnPage=${isAlreadyOnPage} currentUrl=${currentUrl}`,
  );

  if (!isAlreadyOnPage) {
    // set headers to bypass server/CDN cache
    await page.setExtraHTTPHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    });

    // navigate to nameservers page
    await page.goto(targetUrl);
    await page.waitForLoadState('load');

    // wait for React to fully hydrate - only after fresh navigation
    await waitForSquarespaceReactRender({
      page,
      forContent: domainDetailSelectors.nameserversSection,
    });
    await emitBrowserMovieFrame({
      page,
      frame: { name: 'get-nameservers-ready' },
    });

    // wait for page to settle before button state read
    await page.waitForTimeout(1000);
  }
  // else: trust current DOM state from setNameservers; avoid React refresh

  // determine if squarespace default or custom via button visibility
  // .note = squarespace default nameservers are actually googledomains.com, not squarespace.com
  // .note = if "USE SQUARESPACE NAMESERVERS" button is visible, domain has custom NS
  // .note = if "USE CUSTOM NAMESERVERS" button is visible, domain has squarespace default
  const resetButtonLocator = page
    .locator(domainDetailSelectors.useSquarespaceNameserversButton)
    .first();
  const editButtonLocator = page
    .locator(domainDetailSelectors.editNameserversButton)
    .first();

  const resetButtonVisible = await resetButtonLocator.isVisible();
  const editButtonVisible = await editButtonLocator.isVisible();

  // diagnostic: log button visibility for debug
  console.log(
    `[getNameserversScraper] domain=${domain} resetButtonVisible=${resetButtonVisible} editButtonVisible=${editButtonVisible} url=${page.url()}`,
  );

  // fail-fast if neither button is visible (page not fully rendered)
  if (!resetButtonVisible && !editButtonVisible) {
    throw new Error(
      `getNameserversScraper: neither reset nor edit button visible. page may not have fully rendered. url=${page.url()}`,
    );
  }

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
