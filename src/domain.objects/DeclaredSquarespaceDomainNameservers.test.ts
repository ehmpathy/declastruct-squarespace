import { RefByUnique } from 'domain-objects';
import { given, then, when } from 'test-fns';

import { DeclaredSquarespaceDomainNameservers } from './DeclaredSquarespaceDomainNameservers';
import type { DeclaredSquarespaceDomainRegistration } from './DeclaredSquarespaceDomainRegistration';

describe('DeclaredSquarespaceDomainNameservers', () => {
  given('a nameservers declaration', () => {
    when('squarespace default nameservers', () => {
      const nameservers = DeclaredSquarespaceDomainNameservers.as({
        domain: RefByUnique.as<typeof DeclaredSquarespaceDomainRegistration>({
          name: 'example.com',
        }),
        nameservers: null,
      });

      then('nameservers is null', () => {
        expect(nameservers.domain.name).toBe('example.com');
        expect(nameservers.nameservers).toBeNull();
      });
    });

    when('custom nameservers', () => {
      const nameservers = DeclaredSquarespaceDomainNameservers.as({
        domain: RefByUnique.as<typeof DeclaredSquarespaceDomainRegistration>({
          name: 'example.com',
        }),
        nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
      });

      then('nameservers is array of NS hostnames', () => {
        expect(nameservers.domain.name).toBe('example.com');
        expect(nameservers.nameservers).toEqual([
          'ns1.cloudflare.com',
          'ns2.cloudflare.com',
        ]);
      });
    });

    when('static property declarations', () => {
      then('unique key is domain', () => {
        expect(DeclaredSquarespaceDomainNameservers.unique).toEqual(['domain']);
      });

      then('primary key is parent domain reference', () => {
        expect(DeclaredSquarespaceDomainNameservers.primary).toEqual([
          'domain',
        ]);
      });
    });
  });
});
