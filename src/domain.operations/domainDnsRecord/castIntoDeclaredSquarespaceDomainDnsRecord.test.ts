import { given, then, when } from 'test-fns';

import { castIntoDeclaredSquarespaceDomainDnsRecord } from './castIntoDeclaredSquarespaceDomainDnsRecord';

describe('castIntoDeclaredSquarespaceDomainDnsRecord', () => {
  given('raw DNS record data', () => {
    when('casting a basic A record', () => {
      const raw = {
        type: 'A',
        host: '@',
        value: '192.168.1.1',
        ttl: '3600',
        priority: null,
      };

      then('it should create a valid domain object', () => {
        const result = castIntoDeclaredSquarespaceDomainDnsRecord({
          raw,
          domainName: 'example.com',
        });
        expect(result.domain.name).toEqual('example.com');
        expect(result.type).toEqual('A');
        expect(result.host).toEqual('@');
        expect(result.value).toEqual('192.168.1.1');
        expect(result.ttl).toEqual(3600);
        expect(result.priority).toEqual(null);
        expect(result.isPreset).toEqual(false);
      });
    });

    when('casting an MX record with priority', () => {
      const raw = {
        type: 'mx',
        host: '@',
        value: 'mail.example.com',
        ttl: '14400',
        priority: '10',
      };

      then('it should parse priority correctly', () => {
        const result = castIntoDeclaredSquarespaceDomainDnsRecord({
          raw,
          domainName: 'example.com',
        });
        expect(result.type).toEqual('MX');
        expect(result.priority).toEqual(10);
        expect(result.ttl).toEqual(14400);
      });
    });

    when('casting a preset record', () => {
      const raw = {
        type: 'CNAME',
        host: 'www',
        value: 'example.squarespace.com',
        ttl: null,
        priority: null,
      };

      then('it should set isPreset correctly', () => {
        const result = castIntoDeclaredSquarespaceDomainDnsRecord({
          raw,
          domainName: 'example.com',
          isPreset: true,
        });
        expect(result.isPreset).toEqual(true);
        expect(result.ttl).toEqual(3600); // default ttl when null
      });
    });
  });
});
