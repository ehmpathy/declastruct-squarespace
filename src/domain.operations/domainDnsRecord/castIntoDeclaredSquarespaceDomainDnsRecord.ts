import type { RawDnsRecord } from '../../access/sdks/playwright/dnsSettings/scrapeDnsRecords';
import { DeclaredSquarespaceDomainDnsRecord } from '../../domain.objects/DeclaredSquarespaceDomainDnsRecord';
import type { DeclaredSquarespaceDomainDnsRecordType } from '../../domain.objects/literals/DeclaredSquarespaceDomainDnsRecordType';

/**
 * .what = casts raw DNS record data into a DeclaredSquarespaceDomainDnsRecord
 * .why = provides type-safe transformation from scraped data to domain object
 */
export const castIntoDeclaredSquarespaceDomainDnsRecord = (input: {
  raw: RawDnsRecord;
  domainName: string;
  isPreset?: boolean;
}): DeclaredSquarespaceDomainDnsRecord => {
  const { raw, domainName, isPreset = false } = input;

  // parse ttl from string to number (default to 3600 seconds)
  const ttl = raw.ttl ? parseInt(raw.ttl, 10) : 3600;

  // parse priority for MX/SRV records
  const priority = raw.priority ? parseInt(raw.priority, 10) : null;

  return new DeclaredSquarespaceDomainDnsRecord({
    domain: { name: domainName },
    type: raw.type.toUpperCase() as DeclaredSquarespaceDomainDnsRecordType,
    host: raw.host,
    value: raw.value,
    ttl: isNaN(ttl) ? 3600 : ttl,
    priority: isNaN(priority ?? NaN) ? null : priority,
    isPreset,
  });
};
