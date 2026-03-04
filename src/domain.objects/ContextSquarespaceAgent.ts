import type { Page } from 'playwright';

import type { ContextSquarespaceAgentOptions } from './ContextSquarespaceAgentOptions';

/**
 * .what - Context passed to all Squarespace operations
 * .why - Provides access to agent options and logging
 */
export interface ContextSquarespaceAgent {
  agentOptions: ContextSquarespaceAgentOptions;
}

/**
 * .what - Context with an active page (used by page-level operations)
 * .why - Operations that need browser interaction receive the page
 */
export interface ContextSquarespaceAgentPage extends ContextSquarespaceAgent {
  page: Page;
}
