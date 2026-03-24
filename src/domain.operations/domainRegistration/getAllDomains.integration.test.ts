import { given, then, useBeforeAll, when } from 'test-fns';

import {
  getSampleSquarespaceContext,
  requireSquarespaceCredentials,
} from '../../.test/getSampleSquarespaceContext';
import { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';
import { getAllDomains } from './getAllDomains';

/**
 * .what = integration tests for getAllDomains domain operation
 * .why = validates domain retrieval against live Squarespace account
 * .note = requires SQUARESPACE_EMAIL, SQUARESPACE_PASSWORD environment variables
 */
describe('getAllDomains', () => {
  requireSquarespaceCredentials();

  const TEST_DOMAIN = 'sunshineoceansurferturtles.com';

  // get context once before all tests
  // .note = context is created synchronously, not async
  const context = getSampleSquarespaceContext();

  given('a Squarespace account with domains', () => {
    when('getAllDomains is called', () => {
      const result = useBeforeAll(async () => {
        const domains = await getAllDomains({}, context);
        return { domains };
      });

      then('returns an array', () => {
        expect(Array.isArray(result.domains)).toBe(true);
      });

      then('returns at least one domain', () => {
        expect(result.domains.length).toBeGreaterThan(0);
      });

      then(
        'each domain is a DeclaredSquarespaceDomainRegistration instance',
        () => {
          for (const domain of result.domains) {
            expect(domain).toBeInstanceOf(
              DeclaredSquarespaceDomainRegistration,
            );
          }
        },
      );

      then('test domain is in the list', () => {
        const testDomain = result.domains.find(
          (d: DeclaredSquarespaceDomainRegistration) => d.name === TEST_DOMAIN,
        );
        expect(testDomain).toBeDefined();
      });

      then('domains have required properties', () => {
        for (const domain of result.domains) {
          expect(domain.name).toBeDefined();
          expect(typeof domain.name).toBe('string');
          expect(domain.name.length).toBeGreaterThan(0);
          expect(domain.status).toBeDefined();
          expect(domain.registrar).toBeDefined();
        }
      });

      then('test domain has valid status', () => {
        const testDomain = result.domains.find(
          (d: DeclaredSquarespaceDomainRegistration) => d.name === TEST_DOMAIN,
        );
        expect(testDomain?.status).toBe('ACTIVE');
      });
    });

    when('getAllDomains is called again (cached)', () => {
      const result = useBeforeAll(async () => {
        const startTime = Date.now();
        const domains = await getAllDomains({}, context);
        const duration = Date.now() - startTime;
        return { domains, duration };
      });

      then('returns same data', () => {
        expect(result.domains.length).toBeGreaterThan(0);
        const testDomain = result.domains.find(
          (d: DeclaredSquarespaceDomainRegistration) => d.name === TEST_DOMAIN,
        );
        expect(testDomain).toBeDefined();
      });

      then('cache hit is faster than initial call', () => {
        // cache hit should be nearly instant (under 1 second)
        // while fresh scrape takes several seconds per domain
        expect(result.duration).toBeLessThan(1000);
      });
    });
  });
});
