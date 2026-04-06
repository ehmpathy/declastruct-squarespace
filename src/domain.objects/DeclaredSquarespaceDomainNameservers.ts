import { DomainEntity, DomainLiteral, type RefByUnique } from 'domain-objects';

import type { DeclaredSquarespaceDomainRegistration } from './DeclaredSquarespaceDomainRegistration';

/**
 * .what - Nameserver configuration for a Squarespace domain
 * .why - Enables declarative control over DNS provider (squarespace vs cloudflare etc)
 * .identity - Uniquely identified by domain.name
 */
export interface DeclaredSquarespaceDomainNameservers {
  /**
   * .what - Reference to the parent domain
   */
  domain: RefByUnique<typeof DeclaredSquarespaceDomainRegistration>;

  /**
   * .what - Custom nameservers for this domain
   * .why - Allows use of external DNS providers like cloudflare
   * .note - null = squarespace default nameservers, [...] = custom nameservers
   */
  nameservers: string[] | null;
}

export class DeclaredSquarespaceDomainNameservers extends DomainEntity<DeclaredSquarespaceDomainNameservers> {
  // .note = primary is parent reference; unique key ['domain'] handles identity via domain.name
  public static primary = ['domain'] as const;
  public static unique = ['domain'] as const;
  public static metadata = [] as const;
  public static nested = { domain: DomainLiteral };
}
