import { given, then, when } from 'test-fns';

import type { RawTransferRequest } from '../../access/sdks/squarespace.via.playwright/transfersList/scrapeTransferRequests';
import { castIntoDeclaredSquarespaceDomainTransferRequest } from './castIntoDeclaredSquarespaceDomainTransferRequest';

describe('castIntoDeclaredSquarespaceDomainTransferRequest', () => {
  given('a raw transfer request', () => {
    when('status indicates completed', () => {
      const raw: RawTransferRequest = {
        domainName: 'example.com',
        status: 'Transfer Complete',
        direction: 'out',
        initiatedDate: '2024-01-15',
        expiresAt: null,
      };

      then('it should map to COMPLETED status', () => {
        const result = castIntoDeclaredSquarespaceDomainTransferRequest({
          raw,
        });

        expect(result.domain.name).toEqual('example.com');
        expect(result.status).toEqual('COMPLETED');
        expect(result.requestedAt).toBeDefined();
      });
    });

    when('status indicates cancelled', () => {
      const raw: RawTransferRequest = {
        domainName: 'cancelled.com',
        status: 'Cancelled',
        direction: 'out',
        initiatedDate: '2024-01-10',
        expiresAt: null,
      };

      then('it should map to CANCELLED status', () => {
        const result = castIntoDeclaredSquarespaceDomainTransferRequest({
          raw,
        });

        expect(result.domain.name).toEqual('cancelled.com');
        expect(result.status).toEqual('CANCELLED');
      });
    });

    when('status indicates rejected', () => {
      const raw: RawTransferRequest = {
        domainName: 'rejected.com',
        status: 'Transfer Rejected',
        direction: 'out',
        initiatedDate: '2024-01-10',
        expiresAt: null,
      };

      then('it should map to CANCELLED status (terminal state)', () => {
        const result = castIntoDeclaredSquarespaceDomainTransferRequest({
          raw,
        });

        expect(result.domain.name).toEqual('rejected.com');
        expect(result.status).toEqual('CANCELLED');
      });
    });

    when('status indicates expired', () => {
      const raw: RawTransferRequest = {
        domainName: 'expired.com',
        status: 'Code Expired',
        direction: 'out',
        initiatedDate: '2024-01-01',
        expiresAt: null,
      };

      then('it should map to CANCELLED status (terminal state)', () => {
        const result = castIntoDeclaredSquarespaceDomainTransferRequest({
          raw,
        });

        expect(result.domain.name).toEqual('expired.com');
        expect(result.status).toEqual('CANCELLED');
      });
    });

    when('status indicates in progress', () => {
      const raw: RawTransferRequest = {
        domainName: 'pending.com',
        status: 'In Progress',
        direction: 'out',
        initiatedDate: '2024-01-12',
        expiresAt: '2024-01-19',
      };

      then('it should map to IN_PROGRESS status', () => {
        const result = castIntoDeclaredSquarespaceDomainTransferRequest({
          raw,
        });

        expect(result.domain.name).toEqual('pending.com');
        expect(result.status).toEqual('IN_PROGRESS');
      });
    });

    when('status indicates code sent', () => {
      const raw: RawTransferRequest = {
        domainName: 'codesent.com',
        status: 'Code Sent',
        direction: 'out',
        initiatedDate: '2024-01-14',
        expiresAt: null,
      };

      then('it should map to CODE_SENT status', () => {
        const result = castIntoDeclaredSquarespaceDomainTransferRequest({
          raw,
        });

        expect(result.domain.name).toEqual('codesent.com');
        expect(result.status).toEqual('CODE_SENT');
      });
    });

    when('status is unknown with outbound direction', () => {
      const raw: RawTransferRequest = {
        domainName: 'unknown.com',
        status: 'Awaiting',
        direction: 'Outbound',
        initiatedDate: null,
        expiresAt: null,
      };

      then('it should default to REQUESTED', () => {
        const result = castIntoDeclaredSquarespaceDomainTransferRequest({
          raw,
        });

        expect(result.domain.name).toEqual('unknown.com');
        expect(result.status).toEqual('REQUESTED');
      });
    });

    when('initiatedDate is null', () => {
      const raw: RawTransferRequest = {
        domainName: 'nodate.com',
        status: 'Pending',
        direction: 'out',
        initiatedDate: null,
        expiresAt: null,
      };

      then('it should use current time as requestedAt', () => {
        const before = new Date().toISOString();
        const result = castIntoDeclaredSquarespaceDomainTransferRequest({
          raw,
        });
        const after = new Date().toISOString();

        expect(result.requestedAt >= before).toBe(true);
        expect(result.requestedAt <= after).toBe(true);
      });
    });
  });
});
