/**
 * .what = factory for creating mocked Squarespace context for unit tests
 * .why = enables testing domain operations without real browser interactions
 */

// TODO: Phase 1 - implement with real types
// import type { ContextSquarespaceAgent } from '@src/domain.objects/ContextSquarespaceAgent';

/**
 * .what = creates a mocked Squarespace context for unit testing
 * .why = allows domain operations to be tested in isolation
 */
export const getMockedSquarespaceContext = () => {
  // TODO: Phase 2 - implement with mocked browser, page, and cache context
  return {
    agentOptions: {
      account: { name: 'test-account' },
      credentials: {
        email: 'test@example.com',
        password: 'test-password',
        totpSecret: undefined,
      },
      browser: {
        // mocked browser context
      },
      page: {
        // mocked page methods
      },
      request: {
        limiter: {
          // mocked bottleneck
          schedule: async <T>(fn: () => Promise<T>): Promise<T> => fn(),
        },
      },
      remoteState: {
        cache: {
          // mocked cache
          get: async () => null,
          set: async () => {},
        },
      },
    },
    log: {
      info: () => {},
      debug: () => {},
      warn: console.warn,
      error: console.error,
    },
  };
};
