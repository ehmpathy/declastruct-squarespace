import { given, then, when } from 'test-fns';

import { DeclaredSquarespaceDomainRegistration } from './DeclaredSquarespaceDomainRegistration';

describe('DeclaredSquarespaceDomainRegistration', () => {
  given('a domain registration declaration', () => {
    when('instantiating via .as() factory', () => {
      const domain = DeclaredSquarespaceDomainRegistration.as({
        name: 'example.com',
        status: 'ACTIVE',
        isLocked: true,
        lockReason: null,
        registrar: 'SQUARESPACE_DOMAINS_LLC',
        expirationDate: '2025-12-31T00:00:00.000Z',
        dnssecEnabled: false,
        createdAt: '2023-01-15T00:00:00.000Z',
        renewal: 'ENABLED',
      });

      then('creates a valid domain object', () => {
        expect(domain.name).toBe('example.com');
        expect(domain.status).toBe('ACTIVE');
        expect(domain.isLocked).toBe(true);
        expect(domain.lockReason).toBeNull();
        expect(domain.registrar).toBe('SQUARESPACE_DOMAINS_LLC');
        expect(domain.dnssecEnabled).toBe(false);
      });
    });

    when('domain has a lock reason', () => {
      const domain = DeclaredSquarespaceDomainRegistration.as({
        name: 'locked-domain.com',
        status: 'ACTIVE',
        isLocked: true,
        lockReason: 'REGISTRATION_LOCK_60_DAY',
        registrar: 'TUCOWS',
        expirationDate: '2026-06-15T00:00:00.000Z',
        dnssecEnabled: true,
        createdAt: '2024-12-01T00:00:00.000Z',
        renewal: 'DISABLED',
      });

      then('lock reason is captured', () => {
        expect(domain.lockReason).toBe('REGISTRATION_LOCK_60_DAY');
        expect(domain.isLocked).toBe(true);
      });
    });

    when('checking static properties', () => {
      then('unique key is domain name', () => {
        expect(DeclaredSquarespaceDomainRegistration.unique).toEqual(['name']);
      });

      then('readonly properties include status and registrar', () => {
        expect(DeclaredSquarespaceDomainRegistration.readonly).toContain(
          'status',
        );
        expect(DeclaredSquarespaceDomainRegistration.readonly).toContain(
          'registrar',
        );
        expect(DeclaredSquarespaceDomainRegistration.readonly).toContain(
          'createdAt',
        );
        expect(DeclaredSquarespaceDomainRegistration.readonly).toContain(
          'lockReason',
        );
      });

      then('primary key is domain name', () => {
        expect(DeclaredSquarespaceDomainRegistration.primary).toEqual(['name']);
      });
    });
  });
});
