import { given, then, when } from 'test-fns';

import { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';

describe('getAllDomains', () => {
  given('the module is loaded', () => {
    when('imported', () => {
      then('exports getAllDomains function', async () => {
        const mod = await import('./getAllDomains');
        expect(typeof mod.getAllDomains).toEqual('function');
      });

      then('exports addTriggerToGetAllDomains function', async () => {
        const mod = await import('./getAllDomains');
        expect(typeof mod.addTriggerToGetAllDomains).toEqual('function');
      });
    });
  });

  given('the castIntoDeclaredSquarespaceDomainRegistration function', () => {
    when('used in getAllDomains', () => {
      then(
        'returns DeclaredSquarespaceDomainRegistration instances',
        async () => {
          const { castIntoDeclaredSquarespaceDomainRegistration } =
            await import('./castIntoDeclaredSquarespaceDomainRegistration');

          const result = castIntoDeclaredSquarespaceDomainRegistration({
            raw: {
              name: 'example.com',
              status: 'Active',
              registrar: 'Squarespace Domains LLC',
              expirationDate: 'Dec 15, 2025',
              isLocked: false,
              lockReason: null,
              nameservers: [],
            },
          });

          expect(result).toBeInstanceOf(DeclaredSquarespaceDomainRegistration);
          expect(result.name).toEqual('example.com');
        },
      );
    });
  });
});
