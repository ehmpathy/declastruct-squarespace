import { DomainEntity, DomainLiteral, type RefByUnique } from 'domain-objects';

import type { DeclaredSquarespaceDomainRegistration } from './DeclaredSquarespaceDomainRegistration';
import type { DeclaredSquarespaceDomainDnsRecordType } from './literals/DeclaredSquarespaceDomainDnsRecordType';

/**
 * .what - A DNS record associated with a Squarespace domain
 * .why - Required for exporting DNS configuration before transfer
 * .identity - Uniquely identified by domain + type + host
 */
export interface DeclaredSquarespaceDomainDnsRecord {
  /**
   * .what - Reference to the parent domain
   */
  domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>;

  /**
   * .what - DNS record type (A, AAAA, CNAME, MX, TXT, etc.)
   */
  type: DeclaredSquarespaceDomainDnsRecordType;

  /**
   * .what - The host/subdomain (e.g., "@" for root, "www", "mail")
   */
  host: string;

  /**
   * .what - The record value (IP, hostname, text content, etc.)
   */
  value: string;

  /**
   * .what - Time to Live in seconds
   * .why - Controls DNS caching behavior
   */
  ttl: number;

  /**
   * .what - Priority value (for MX, SRV records)
   */
  priority: number | null;

  /**
   * .what - Whether this is a Squarespace preset or custom record
   * .why - Presets may have special handling for deletion
   */
  isPreset: boolean;
}

export class DeclaredSquarespaceDomainDnsRecord extends DomainEntity<DeclaredSquarespaceDomainDnsRecord> {
  // .note = primary is parent reference; unique key ['domain', 'type', 'host'] handles identity
  public static primary = ['domain'] as const;
  public static unique = ['domain', 'type', 'host'] as const;
  public static metadata = [] as const;
  public static readonly = ['isPreset'] as const;
  public static nested = { domain: DomainLiteral };
}
