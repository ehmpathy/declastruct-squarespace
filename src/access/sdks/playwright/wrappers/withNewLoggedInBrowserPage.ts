import { withExtendableCache } from 'with-simple-cache';

import type {
  ContextSquarespaceAgent,
  ContextSquarespaceAgentPage,
} from '@src/domain.objects/ContextSquarespaceAgent';

import { getNewLoggedInBrowserPage } from '../browser/getNewLoggedInBrowserPage';

/**
 * .what - Wrapper that provides a logged-in browser page to operations
 * .why - Centralizes page lifecycle, concurrency control, and error recovery
 */
export const withNewLoggedInBrowserPage = <TInput, TOutput>(
  logic: (
    input: TInput,
    context: ContextSquarespaceAgentPage,
  ) => Promise<TOutput>,
  options?: {
    /**
     * Key for page reuse across operations
     * .why - SPAs benefit from keeping page open (avoid initial load)
     * .example - 'domainDetail' for domain detail operations
     */
    reusePageKey?: string;
  },
) => {
  return async (
    input: TInput,
    context: ContextSquarespaceAgent,
  ): Promise<TOutput> => {
    const { agentOptions } = context;

    // Execute within bottleneck (one operation at a time)
    return agentOptions.browser.bottleneck.schedule(async () => {
      // Get or create page (with optional caching + invalidation on error)
      const getPage = options?.reusePageKey
        ? withExtendableCache(() => getNewLoggedInBrowserPage(agentOptions), {
            cache: agentOptions.page.cache,
            serialize: {
              key: () =>
                [options.reusePageKey, agentOptions.account.id].join('.'),
            },
          })
        : {
            execute: () => getNewLoggedInBrowserPage(agentOptions),
            invalidate: undefined,
          };

      const page = await getPage.execute();

      try {
        await page.bringToFront();
        const result = await logic(input, { ...context, page });

        // Close page unless reusing
        if (!options?.reusePageKey) {
          await page.close();
        }

        return result;
      } catch (error) {
        // Invalidate cached page on error (page may be in bad state)
        if (getPage.invalidate) {
          getPage.invalidate({ forInput: [] });
        }
        await page.close().catch(() => {}); // Best effort close
        throw error;
      }
    });
  };
};
