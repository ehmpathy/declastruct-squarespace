import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceContext,
  requireSquarespaceCredentials,
} from '../../../../.test/getSampleSquarespaceContext';
import { getNewLoggedInBrowserPage } from '../browser/getNewLoggedInBrowserPage';
import { requestTransferCode } from './requestTransferCode';
import { toggleDomainLock } from './toggleDomainLock';

/**
 * .what = integration tests for requestTransferCode scraper
 * .why = validates transfer code request flow against live Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 * .note = squarespace sends the code via EMAIL, not displayed on page
 */
describe('requestTransferCode', () => {
  requireSquarespaceCredentials();

  const TEST_DOMAIN = 'sunshineoceansurferturtles.com';

  given('a logged-in browser session', () => {
    const scene = useBeforeAll(async () => {
      const context = getSampleSquarespaceContext();
      const page = await getNewLoggedInBrowserPage(context.agentOptions);
      return { context, page };
    });

    given('domain is unlocked', () => {
      useBeforeAll(async () => {
        // unlock domain first to enable transfer code request
        await toggleDomainLock({
          page: scene.page,
          domain: TEST_DOMAIN,
          targetState: 'unlocked',
          credentials: scene.context.agentOptions.credentials,
        });
        return {};
      });

      when('transfer code is requested', () => {
        const result = useBeforeAll(async () => {
          const requestResult = await requestTransferCode({
            page: scene.page,
            domain: TEST_DOMAIN,
            credentials: scene.context.agentOptions.credentials,
          });
          // log actual result for observability
          console.log(
            'requestTransferCode result:',
            JSON.stringify(requestResult, null, 2),
          );
          return { requestResult };
        });

        then('confirms code was sent via email', () => {
          expect(result.requestResult.codeSentViaEmail).toBe(true);
        });
      });

      when('transfer code is requested again (idempotent)', () => {
        const result = useBeforeAll(async () => {
          // second request should also succeed (squarespace re-sends email)
          const secondResult = await requestTransferCode({
            page: scene.page,
            domain: TEST_DOMAIN,
            credentials: scene.context.agentOptions.credentials,
          });
          return { secondResult };
        });

        then('confirms code was sent via email', () => {
          expect(result.secondResult.codeSentViaEmail).toBe(true);
        });
      });
    });
  });
});
