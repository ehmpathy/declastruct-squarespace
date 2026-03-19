import { given, then, when } from 'test-fns';

import { getDeclastructSquarespaceProvider } from './getDeclastructSquarespaceProvider';

describe('getDeclastructSquarespaceProvider', () => {
  given('valid input', () => {
    const input = {
      account: {
        id: 'test-account-id',
        email: 'test@example.com',
      },
      credentials: {
        email: 'test@example.com',
        password: 'test-password',
      },
    };

    when('called', () => {
      const provider = getDeclastructSquarespaceProvider(input);

      then('returns a provider with context', () => {
        expect(provider.context).toBeDefined();
        expect(provider.context.agentOptions).toBeDefined();
        expect(provider.context.agentOptions.account.id).toEqual(
          'test-account-id',
        );
      });

      then('returns a provider with DAOs', () => {
        expect(provider.daos).toBeDefined();
        expect(
          provider.daos.DeclaredSquarespaceDomainRegistration,
        ).toBeDefined();
        expect(provider.daos.DeclaredSquarespaceDomainDnsRecord).toBeDefined();
        expect(
          provider.daos.DeclaredSquarespaceDomainTransferRequest,
        ).toBeDefined();
      });

      then('DAOs have expected methods', () => {
        // domain registration DAO
        expect(
          provider.daos.DeclaredSquarespaceDomainRegistration.get.one.byUnique,
        ).toBeInstanceOf(Function);
        expect(
          provider.daos.DeclaredSquarespaceDomainRegistration.get.all,
        ).toBeInstanceOf(Function);
        expect(
          provider.daos.DeclaredSquarespaceDomainRegistration.set.upsert,
        ).toBeInstanceOf(Function);

        // dns record DAO (get only - set operations removed per wish scope)
        expect(
          provider.daos.DeclaredSquarespaceDomainDnsRecord.get.one.byUnique,
        ).toBeInstanceOf(Function);
        expect(
          provider.daos.DeclaredSquarespaceDomainDnsRecord.get.all,
        ).toBeInstanceOf(Function);

        // transfer request DAO
        expect(
          provider.daos.DeclaredSquarespaceDomainTransferRequest.get.one
            .byUnique,
        ).toBeInstanceOf(Function);
        expect(
          provider.daos.DeclaredSquarespaceDomainTransferRequest.get.all,
        ).toBeInstanceOf(Function);
        expect(
          provider.daos.DeclaredSquarespaceDomainTransferRequest.set.findsert,
        ).toBeInstanceOf(Function);
      });
    });
  });

  given('input with TOTP secret', () => {
    const input = {
      account: {
        id: 'test-account-id',
        email: 'test@example.com',
      },
      credentials: {
        email: 'test@example.com',
        password: 'test-password',
        totpSecret: 'JBSWY3DPEHPK3PXP',
      },
    };

    when('called', () => {
      const provider = getDeclastructSquarespaceProvider(input);

      then('agent options include TOTP', () => {
        expect(provider.context.agentOptions.credentials.totp).toBeDefined();
        expect(provider.context.agentOptions.credentials.totp?.secret).toEqual(
          'JBSWY3DPEHPK3PXP',
        );
      });
    });
  });

  given('input with custom cache directory', () => {
    const input = {
      account: {
        id: 'test-account-id',
        email: 'test@example.com',
      },
      credentials: {
        email: 'test@example.com',
        password: 'test-password',
      },
      cache: {
        directory: '.cache/test-custom',
      },
    };

    when('called', () => {
      const provider = getDeclastructSquarespaceProvider(input);

      then('agent options are created', () => {
        // cache is internal, just verify provider is created successfully
        expect(provider.context.agentOptions).toBeDefined();
      });
    });
  });
});
