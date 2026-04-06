import { given, then, when } from 'test-fns';

import type { RawDomainDetail } from '../../access/sdks/squarespace.via.playwright/domainDetail/scrapeDomainDetail';
import { castIntoDeclaredSquarespaceDomainNameservers } from './castIntoDeclaredSquarespaceDomainNameservers';

const createRawDetail = (
  overrides: Partial<RawDomainDetail>,
): RawDomainDetail => ({
  name: 'example.com',
  status: 'Active',
  isLocked: true,
  lockReason: null,
  registrar: 'Squarespace Domains LLC',
  expirationDate: '2026-12-15',
  nameservers: [],
  ...overrides,
});

describe('castIntoDeclaredSquarespaceDomainNameservers', () => {
  given('raw domain detail', () => {
    when('squarespace default nameservers (empty array)', () => {
      const raw = createRawDetail({
        name: 'example.com',
        nameservers: [],
      });

      then('nameservers is null', () => {
        const result = castIntoDeclaredSquarespaceDomainNameservers({ raw });
        expect(result.domain.name).toBe('example.com');
        expect(result.nameservers).toBeNull();
      });
    });

    when('squarespace default nameservers (contains squarespace)', () => {
      const raw = createRawDetail({
        name: 'example.com',
        nameservers: ['ns1.squarespace.com', 'ns2.squarespace.com'],
      });

      then('nameservers is null', () => {
        const result = castIntoDeclaredSquarespaceDomainNameservers({ raw });
        expect(result.domain.name).toBe('example.com');
        expect(result.nameservers).toBeNull();
      });
    });

    when('custom nameservers (cloudflare)', () => {
      const raw = createRawDetail({
        name: 'example.com',
        nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
      });

      then('nameservers is array of custom NS hostnames', () => {
        const result = castIntoDeclaredSquarespaceDomainNameservers({ raw });
        expect(result.domain.name).toBe('example.com');
        expect(result.nameservers).toEqual([
          'ns1.cloudflare.com',
          'ns2.cloudflare.com',
        ]);
      });
    });

    when('custom nameservers (other provider)', () => {
      const raw = createRawDetail({
        name: 'example.com',
        nameservers: ['ns1.google.com', 'ns2.google.com'],
      });

      then('nameservers is array of custom NS hostnames', () => {
        const result = castIntoDeclaredSquarespaceDomainNameservers({ raw });
        expect(result.nameservers).toEqual([
          'ns1.google.com',
          'ns2.google.com',
        ]);
      });
    });
  });
});
