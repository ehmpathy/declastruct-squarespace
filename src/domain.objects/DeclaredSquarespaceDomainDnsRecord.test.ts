import { RefByUnique } from 'domain-objects';
import { given, then, when } from 'test-fns';

import { DeclaredSquarespaceDomainDnsRecord } from './DeclaredSquarespaceDomainDnsRecord';
import type { DeclaredSquarespaceDomainRegistration } from './DeclaredSquarespaceDomainRegistration';

describe('DeclaredSquarespaceDomainDnsRecord', () => {
  given('a DNS record declaration', () => {
    when('creating an A record', () => {
      const record = DeclaredSquarespaceDomainDnsRecord.as({
        domain: RefByUnique.as<typeof DeclaredSquarespaceDomainRegistration>({
          name: 'example.com',
        }),
        type: 'A',
        host: '@',
        value: '192.0.2.1',
        ttl: 3600,
        priority: null,
        isPreset: false,
      });

      then('creates a valid DNS record', () => {
        expect(record.domain.name).toBe('example.com');
        expect(record.type).toBe('A');
        expect(record.host).toBe('@');
        expect(record.value).toBe('192.0.2.1');
        expect(record.ttl).toBe(3600);
        expect(record.priority).toBeNull();
        expect(record.isPreset).toBe(false);
      });
    });

    when('creating an MX record with priority', () => {
      const record = DeclaredSquarespaceDomainDnsRecord.as({
        domain: RefByUnique.as<typeof DeclaredSquarespaceDomainRegistration>({
          name: 'example.com',
        }),
        type: 'MX',
        host: '@',
        value: 'mail.example.com',
        ttl: 3600,
        priority: 10,
        isPreset: false,
      });

      then('priority is captured', () => {
        expect(record.type).toBe('MX');
        expect(record.priority).toBe(10);
      });
    });

    when('creating a preset record', () => {
      const record = DeclaredSquarespaceDomainDnsRecord.as({
        domain: RefByUnique.as<typeof DeclaredSquarespaceDomainRegistration>({
          name: 'example.com',
        }),
        type: 'CNAME',
        host: 'www',
        value: 'ext-sq.squarespace.com',
        ttl: 3600,
        priority: null,
        isPreset: true,
      });

      then('isPreset is true', () => {
        expect(record.isPreset).toBe(true);
      });
    });

    when('checking static properties', () => {
      then('unique key is composite of domain, type, host', () => {
        expect(DeclaredSquarespaceDomainDnsRecord.unique).toEqual([
          'domain',
          'type',
          'host',
        ]);
      });

      then('isPreset is readonly', () => {
        expect(DeclaredSquarespaceDomainDnsRecord.readonly).toContain(
          'isPreset',
        );
      });

      then('primary key is parent domain reference', () => {
        expect(DeclaredSquarespaceDomainDnsRecord.primary).toEqual(['domain']);
      });
    });
  });
});
