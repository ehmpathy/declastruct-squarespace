import { BadRequestError } from 'helpful-errors';
import { withExtendableCache } from 'with-simple-cache';

import type {
  ContextSquarespaceAgent,
  ContextSquarespaceAgentPage,
} from '@src/domain.objects/ContextSquarespaceAgent';

import { checkSessionHealth } from '../auth/checkSessionHealth';
import { performSquarespaceLogin } from '../auth/performSquarespaceLogin';
import { getNewLoggedInBrowserPage } from '../browser/getNewLoggedInBrowserPage';
import { capturePageStateOnError } from '../debug/capturePageStateOnError';

/**
 * .what = detect if we are in test mode
 * .why = never close pages in test mode so humans/robots can inspect after failure
 */
const isTestMode = (): boolean => process.env.NODE_ENV === 'test';

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
     * .why - SPAs benefit from page kept open (avoid initial load)
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
      // Get or create page (with optional cache + invalidation on error)
      const getPage = options?.reusePageKey
        ? withExtendableCache(() => getNewLoggedInBrowserPage(agentOptions), {
            cache: agentOptions.page.cache,
            serialize: {
              key: () =>
                [options.reusePageKey, agentOptions.account.email].join('.'),
            },
          })
        : {
            execute: () => getNewLoggedInBrowserPage(agentOptions),
            invalidate: undefined,
          };

      const page = await getPage.execute();

      // check session health before each operation (mitigate session expiry in long batches)
      const sessionStatus = await checkSessionHealth(page);
      if (!sessionStatus.valid) {
        // session expired - re-login on current page
        try {
          await performSquarespaceLogin(page, agentOptions.credentials);
        } catch (error) {
          // wrap auth errors to clarify this is a session refresh failure (per criteria usecase.7)
          if (error instanceof BadRequestError) {
            throw new BadRequestError('session refresh failed', {
              reason: sessionStatus.reason,
              authError: error.message,
              hint: 'fix credentials and resume batch',
            });
          }
          throw error;
        }
      }

      try {
        await page.bringToFront();
        const result = await logic(input, { ...context, page });

        // close page unless reused OR in test mode
        // .note - never close in test mode so humans/robots can inspect after
        // .note - page.close() has fail-fast guard that throws in test mode anyway
        if (!options?.reusePageKey && !isTestMode()) {
          await page.close();
        }

        // add random delay to reduce predictable patterns (bot detection mitigation)
        // .note - combined with bottleneck minTime of 500ms, total delay is 700-1000ms
        const randomDelay = Math.floor(Math.random() * 300) + 200; // 200-500ms extra
        await new Promise((resolve) => setTimeout(resolve, randomDelay));

        return result;
      } catch (error) {
        // capture page state for debug BEFORE any cleanup
        if (error instanceof Error) {
          await capturePageStateOnError({ page, error }).catch(() => {});
        }

        // invalidate cached page on error (page may be in bad state)
        if (getPage.invalidate) {
          getPage.invalidate({ forInput: [] });
        }

        // close page ONLY if not in test mode
        // .note - never close in test mode so humans/robots can inspect after failure
        // .note - page.close() has fail-fast guard that throws in test mode anyway
        if (!isTestMode()) {
          await page.close();
        }

        throw error;
      }
    });
  };
};
