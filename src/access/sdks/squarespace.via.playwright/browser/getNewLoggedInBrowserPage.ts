import { UnexpectedCodePathError } from 'helpful-errors';
import type { Page } from 'playwright';

import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { genBrowserAuthSession } from './genBrowserAuthSession';

/**
 * .what = detect if we are in test mode
 * .why = fail-fast if someone tries to close a page in test mode
 */
const isTestMode = (): boolean => process.env.NODE_ENV === 'test';

/**
 * .what = wrap page to fail-fast on close() in test mode
 * .why = pages must never close in test mode so humans/robots can inspect after failure
 */
const wrapPageWithTestModeGuard = (page: Page): Page => {
  const originalClose = page.close.bind(page);
  page.close = async () => {
    if (isTestMode()) {
      throw new UnexpectedCodePathError(
        'page.close() blocked in test mode. pages must stay open for inspection.',
        { hint: 'remove the close() call or run outside test mode' },
      );
    }
    return originalClose();
  };
  return page;
};

/**
 * .what - get a new page from the browser auth session
 * .why - provides fresh page for operations; reuses browser session
 * .note - callers should use withNewLoggedInBrowserPage wrapper for bottleneck
 * .note - page.close() is blocked in test mode to prevent accidental closure
 */
export const getNewLoggedInBrowserPage = async (
  agentOptions: ContextSquarespaceAgentOptions,
): Promise<Page> => {
  const session = await genBrowserAuthSession(agentOptions);
  const page = await session.context.newPage();
  return wrapPageWithTestModeGuard(page);
};
