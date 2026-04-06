import type { Page } from 'playwright';

import { emitBrowserMovieFrame } from '@src/_topublish/kermet/emitBrowserMovieFrame';
import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { handleReauthentication } from '../auth/handleReauthentication';
import { waitForSquarespaceReactRender } from '../navigation/waitForSquarespaceReactRender';
import { domainDetailSelectors } from '../selectors/domainDetailSelectors';
import { getNameserversScraper } from './getNameserversScraper';

/**
 * .what = sets domain nameservers via squarespace UI
 * .why = enables programmatic control over DNS provider
 * .note = idempotent — verifies result after change
 */
export const setNameserversScraper = async (input: {
  page: Page;
  domain: string;
  nameservers: string[] | null;
  credentials: ContextSquarespaceAgentOptions['credentials'];
}): Promise<{
  success: boolean;
  nameservers: string[] | null;
}> => {
  const { page, domain, nameservers, credentials } = input;
  const targetUrl = `https://account.squarespace.com/domains/managed/${domain}/dns/domain-nameservers`;

  // navigate to nameservers page if not already there
  if (!page.url().includes(`${domain}/dns/domain-nameservers`)) {
    await page.goto(targetUrl);
    await page.waitForLoadState('load');
  }

  // wait for React to fully hydrate
  await waitForSquarespaceReactRender({
    page,
    forContent: domainDetailSelectors.nameserversSection,
  });
  await emitBrowserMovieFrame({
    page,
    frame: { name: 'nameservers-page-ready' },
  });

  // handle reset to squarespace default
  if (nameservers === null) {
    const resetButton = page
      .locator(domainDetailSelectors.useSquarespaceNameserversButton)
      .first();
    const resetVisible = await resetButton.isVisible();

    if (resetVisible) {
      await emitBrowserMovieFrame({
        page,
        frame: { name: 'reset-button-found' },
      });
      await resetButton.click();
      await page.waitForTimeout(1000);

      // handle reauthentication if it appears (can appear before confirmation dialog)
      await handleReauthentication(page, credentials);

      // wait for page to stabilize after potential reauth
      await page.waitForTimeout(1000);

      // handle confirmation dialog that appears after reset click (and after reauth)
      const confirmButton = page
        .locator(domainDetailSelectors.resetNameserversConfirmButton)
        .first();
      const confirmVisible = await confirmButton.isVisible();
      if (confirmVisible) {
        await emitBrowserMovieFrame({
          page,
          frame: { name: 'reset-confirm-dialog' },
        });
        await confirmButton.click();
        await page.waitForTimeout(2000);

        // handle reauthentication again if it appears after confirm
        await handleReauthentication(page, credentials);
      }

      await page.waitForTimeout(2000);
      await emitBrowserMovieFrame({
        page,
        frame: { name: 'nameservers-reset' },
      });
    }

    // reset button not visible = already on squarespace default
    if (!resetVisible) {
      await emitBrowserMovieFrame({
        page,
        frame: { name: 'already-squarespace-default' },
      });
    }
  }

  // handle custom nameservers
  if (nameservers !== null) {
    // open edit modal
    try {
      await page.waitForSelector(domainDetailSelectors.editNameserversButton, {
        timeout: 10000,
      });
    } catch {
      return {
        success: false,
        nameservers: null,
      };
    }
    const editButton = page
      .locator(domainDetailSelectors.editNameserversButton)
      .first();
    await editButton.click();

    // wait for modal to appear
    await page.waitForSelector(domainDetailSelectors.nameserverEditModal, {
      timeout: 10000,
    });
    await emitBrowserMovieFrame({
      page,
      frame: { name: 'nameserver-modal-open' },
    });

    // fill custom nameservers
    const nsInputs = page.locator(domainDetailSelectors.customNameserverInputs);
    const inputCount = await nsInputs.count();

    for (let i = 0; i < nameservers.length && i < inputCount; i++) {
      const nsInput = nsInputs.nth(i);
      await nsInput.clear();
      await nsInput.fill(nameservers[i]!);
    }

    await emitBrowserMovieFrame({
      page,
      frame: { name: 'nameservers-filled' },
    });

    // handle reauthentication if overlay appears before save
    await handleReauthentication(page, credentials);

    // wait for modal to be visible again after any reauth overlay
    await page.waitForSelector(domainDetailSelectors.nameserverEditModal, {
      state: 'visible',
      timeout: 10000,
    });

    // re-fill inputs after reauth (reauth may clear modal inputs)
    // .note = reauth can refresh the page/modal which clears values
    const nsInputsAfterReauth = page.locator(
      domainDetailSelectors.customNameserverInputs,
    );
    const inputCountAfterReauth = await nsInputsAfterReauth.count();
    for (let i = 0; i < nameservers.length && i < inputCountAfterReauth; i++) {
      const nsInput = nsInputsAfterReauth.nth(i);
      await nsInput.clear();
      await nsInput.fill(nameservers[i]!);
    }
    await emitBrowserMovieFrame({
      page,
      frame: { name: 'nameservers-refilled-after-reauth' },
    });

    // click save button
    const saveButton = page
      .locator(domainDetailSelectors.saveNameserversButton)
      .first();
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveButton.click();
    await page.waitForTimeout(2000);

    // handle reauthentication again (may appear after save click)
    await handleReauthentication(page, credentials);

    // wait for modal to close
    // .note = modal selector is broad; use first() to avoid multiple match issues
    try {
      await page.waitForSelector(domainDetailSelectors.nameserverEditModal, {
        state: 'hidden',
        timeout: 10000,
      });
    } catch {
      // modal may already be closed or never was visible; continue
    }

    // extra wait for page state to settle after modal close
    await page.waitForTimeout(2000);
    await emitBrowserMovieFrame({ page, frame: { name: 'nameservers-saved' } });
  }

  // verify result via getter scraper
  // .note = ensures verification uses identical logic to getNameservers
  await emitBrowserMovieFrame({
    page,
    frame: { name: 'nameservers-verify-start' },
  });
  const verified = await getNameserversScraper({ page, domain });
  await emitBrowserMovieFrame({
    page,
    frame: { name: 'nameservers-verified' },
  });

  return {
    success: true,
    nameservers: verified.nameservers,
  };
};
