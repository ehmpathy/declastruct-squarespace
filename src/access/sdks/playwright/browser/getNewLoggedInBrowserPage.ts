import type { Page } from 'playwright';

import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { findOrCreateLoggedInBrowser } from './findOrCreateLoggedInBrowser';

/**
 * .what - Get a new logged-in page from the cached browser
 * .why - Provides fresh page for operations while reusing browser session
 */
export const getNewLoggedInBrowserPage = async (
  agentOptions: ContextSquarespaceAgentOptions,
): Promise<Page> => {
  const { context } = await findOrCreateLoggedInBrowser(agentOptions);
  return context.newPage();
};
