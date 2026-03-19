import { given, then, when } from 'test-fns';

import type { RawDomainDetail } from '../../access/sdks/squarespace.via.playwright/domainDetail/scrapeDomainDetail';
import { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';
import { castIntoDeclaredSquarespaceDomainRegistration } from './castIntoDeclaredSquarespaceDomainRegistration';

describe('castIntoDeclaredSquarespaceDomainRegistration', () => {
  given('raw domain detail with active status', () => {
    const raw: RawDomainDetail = {
      name: 'example.com',
      status: 'Active',
      registrar: 'Squarespace Domains LLC',
      expirationDate: 'Dec 15, 2025',
      isLocked: true,
      lockReason: null,
      nameservers: ['ns1.squarespace.com', 'ns2.squarespace.com'],
    };

    when('cast to domain registration', () => {
      then('returns DeclaredSquarespaceDomainRegistration instance', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({ raw });
        expect(result).toBeInstanceOf(DeclaredSquarespaceDomainRegistration);
      });

      then('name is preserved', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({ raw });
        expect(result.name).toEqual('example.com');
      });

      then('status is parsed to ACTIVE', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({ raw });
        expect(result.status).toEqual('ACTIVE');
      });

      then('registrar is parsed to SQUARESPACE_DOMAINS_LLC', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({ raw });
        expect(result.registrar).toEqual('SQUARESPACE_DOMAINS_LLC');
      });

      then('expirationDate is parsed to ISO date', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({ raw });
        expect(result.expirationDate).toEqual('2025-12-15');
      });

      then('isLocked is preserved', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({ raw });
        expect(result.isLocked).toEqual(true);
      });

      then('lockReason is null when none provided', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({ raw });
        expect(result.lockReason).toBeNull();
      });

      then('autoRenew defaults to false', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({ raw });
        expect(result.autoRenew).toEqual(false);
      });

      then('dnssecEnabled defaults to false', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({ raw });
        expect(result.dnssecEnabled).toEqual(false);
      });
    });
  });

  given('raw domain detail with expired status', () => {
    const raw: RawDomainDetail = {
      name: 'expired-domain.org',
      status: 'Expired',
      registrar: null,
      expirationDate: null,
      isLocked: false,
      lockReason: null,
      nameservers: [],
    };

    when('cast to domain registration', () => {
      then('status is parsed to EXPIRED', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({ raw });
        expect(result.status).toEqual('EXPIRED');
      });

      then('registrar defaults to SQUARESPACE_DOMAINS_LLC', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({ raw });
        expect(result.registrar).toEqual('SQUARESPACE_DOMAINS_LLC');
      });
    });
  });

  given('raw domain detail with registration lock reason', () => {
    const raw: RawDomainDetail = {
      name: 'new-domain.com',
      status: 'Active',
      registrar: 'Squarespace Domains II LLC',
      expirationDate: 'Jan 1, 2026',
      isLocked: true,
      lockReason: 'New registration - 60 day lock',
      nameservers: [],
    };

    when('cast to domain registration', () => {
      then('lockReason is parsed to REGISTRATION_LOCK_60_DAY', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({ raw });
        expect(result.lockReason).toEqual('REGISTRATION_LOCK_60_DAY');
      });

      then('registrar is parsed to SQUARESPACE_DOMAINS_II_LLC', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({ raw });
        expect(result.registrar).toEqual('SQUARESPACE_DOMAINS_II_LLC');
      });
    });
  });

  given('raw domain detail with transfer lock reason', () => {
    const raw: RawDomainDetail = {
      name: 'transferred-domain.net',
      status: 'Active',
      registrar: 'Tucows',
      expirationDate: 'Mar 20, 2025',
      isLocked: true,
      lockReason: 'Transfer lock - 60 days remaining',
      nameservers: [],
    };

    when('cast to domain registration', () => {
      then('lockReason is parsed to TRANSFER_LOCK_60_DAY', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({ raw });
        expect(result.lockReason).toEqual('TRANSFER_LOCK_60_DAY');
      });

      then('registrar is parsed to TUCOWS', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({ raw });
        expect(result.registrar).toEqual('TUCOWS');
      });
    });
  });

  given('raw domain detail with contact update lock reason', () => {
    const raw: RawDomainDetail = {
      name: 'updated-contact.io',
      status: 'Active',
      registrar: 'Key-Systems',
      expirationDate: 'Jul 10, 2025',
      isLocked: true,
      lockReason: 'Registrant contact change lock',
      nameservers: [],
    };

    when('cast to domain registration', () => {
      then('lockReason is parsed to CONTACT_UPDATE_LOCK', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({ raw });
        expect(result.lockReason).toEqual('CONTACT_UPDATE_LOCK');
      });

      then('registrar is parsed to KEY_SYSTEMS', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({ raw });
        expect(result.registrar).toEqual('KEY_SYSTEMS');
      });
    });
  });

  given('optional parameters provided', () => {
    const raw: RawDomainDetail = {
      name: 'configured-domain.com',
      status: 'Active',
      registrar: 'Squarespace Domains LLC',
      expirationDate: 'Dec 31, 2025',
      isLocked: false,
      lockReason: null,
      nameservers: [],
    };

    when('autoRenew and dnssecEnabled are explicitly set', () => {
      then('autoRenew is respected', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({
          raw,
          autoRenew: true,
        });
        expect(result.autoRenew).toEqual(true);
      });

      then('dnssecEnabled is respected', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({
          raw,
          dnssecEnabled: true,
        });
        expect(result.dnssecEnabled).toEqual(true);
      });

      then('createdAt is respected', () => {
        const result = castIntoDeclaredSquarespaceDomainRegistration({
          raw,
          createdAt: '2024-06-15',
        });
        expect(result.createdAt).toEqual('2024-06-15');
      });
    });
  });
});
