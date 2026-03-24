import type { Page, Browser } from 'playwright';

/**
 * .what = navigate to DNS settings from domain detail page
 * .why = find the correct path to DNS records
 *
 * .prereq = must be on a domain detail page first
 */
export const action = async (input: { page: Page; browser: Browser }) => {
  const { page } = input;

  // look for DNS-related links on the page
  const dnsLinks = await page.$$eval('a', (links) =>
    links
      .filter(
        (a) =>
          a.textContent?.toLowerCase().includes('dns') ||
          a.href?.includes('dns'),
      )
      .map((a) => ({
        text: a.textContent?.trim(),
        href: a.href,
      })),
  );

  console.log('DNS links found:', JSON.stringify(dnsLinks, null, 2));

  // click the first DNS link if found
  if (dnsLinks.length > 0) {
    const dnsLink = page.locator('a').filter({
      hasText: /dns/i,
    });
    await dnsLink.first().click();
    await page.waitForLoadState('load');
  }

  return {
    dnsLinks,
    url: page.url(),
  };
};
