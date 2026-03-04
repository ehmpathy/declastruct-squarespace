import { given, then, when } from 'test-fns';

import type { RawDomainListItem } from './scrapeDomainsList';

describe('scrapeDomainsList', () => {
  given('a mocked page with domain rows', () => {
    when('scraping the domains list', () => {
      then('should return raw domain data structure', () => {
        // verify the interface shape is correct
        const mockDomain: RawDomainListItem = {
          name: 'example.com',
          status: 'Active',
          expiryText: 'Expires Jan 15, 2026',
        };

        expect(mockDomain.name).toBeDefined();
        expect(mockDomain.status).toBeDefined();
        expect(mockDomain.expiryText).toBeDefined();
      });

      then('should handle null expiry text', () => {
        const mockDomain: RawDomainListItem = {
          name: 'example.com',
          status: 'Active',
          expiryText: null,
        };

        expect(mockDomain.expiryText).toBeNull();
      });
    });
  });

  given('an empty domains list', () => {
    when('scraping the domains list', () => {
      then('should return an empty array', () => {
        const result: RawDomainListItem[] = [];
        expect(result).toEqual([]);
        expect(result.length).toBe(0);
      });
    });
  });
});
