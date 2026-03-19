import type { Page } from 'playwright';

import type { ContextSquarespaceAgentOptions } from '@src/domain.objects/ContextSquarespaceAgentOptions';

import { genBrowserAuthSession } from './genBrowserAuthSession';

/**
 * .what - get a new page from the browser auth session
 * .why - provides fresh page for operations; reuses browser session
 */
export const getNewLoggedInBrowserPage = async (
  agentOptions: ContextSquarespaceAgentOptions,
): Promise<Page> => {
  const session = await genBrowserAuthSession(agentOptions);
  return session.context.newPage();
};
