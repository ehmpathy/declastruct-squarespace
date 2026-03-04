/**
 * .what - DNS record types supported by Squarespace
 * .why - Constrains DNS record type to valid Squarespace options
 */
export type DeclaredSquarespaceDomainDnsRecordType =
  | 'A'
  | 'AAAA'
  | 'ALIAS'
  | 'CNAME'
  | 'MX'
  | 'TXT'
  | 'SRV'
  | 'NS'
  | 'CAA'
  | 'DS'
  | 'DNSKEY';
