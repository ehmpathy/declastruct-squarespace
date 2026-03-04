import { given, then, when } from 'test-fns';

import { DeclaredSquarespaceDomainTransferRequest } from './DeclaredSquarespaceDomainTransferRequest';

describe('DeclaredSquarespaceDomainTransferRequest', () => {
  given('a transfer request declaration', () => {
    when('creating a new transfer request', () => {
      const request = DeclaredSquarespaceDomainTransferRequest.as({
        domain: { name: 'example.com' },
        requestedAt: '2025-01-15T10:30:00.000Z',
        status: 'REQUESTED',
      });

      then('creates a valid transfer request', () => {
        expect(request.domain.name).toBe('example.com');
        expect(request.requestedAt).toBe('2025-01-15T10:30:00.000Z');
        expect(request.status).toBe('REQUESTED');
      });
    });

    when('transfer request has progressed', () => {
      const request = DeclaredSquarespaceDomainTransferRequest.as({
        domain: { name: 'transferred-domain.com' },
        requestedAt: '2025-01-10T08:00:00.000Z',
        status: 'IN_PROGRESS',
      });

      then('status reflects progress', () => {
        expect(request.status).toBe('IN_PROGRESS');
      });
    });

    when('checking static properties', () => {
      then('unique key is domain reference', () => {
        expect(DeclaredSquarespaceDomainTransferRequest.unique).toEqual([
          'domain',
        ]);
      });

      then('requestedAt is metadata', () => {
        expect(DeclaredSquarespaceDomainTransferRequest.metadata).toContain(
          'requestedAt',
        );
      });

      then('requestedAt and status are readonly', () => {
        expect(DeclaredSquarespaceDomainTransferRequest.readonly).toContain(
          'requestedAt',
        );
        expect(DeclaredSquarespaceDomainTransferRequest.readonly).toContain(
          'status',
        );
      });

      then('primary key is domain reference', () => {
        expect(DeclaredSquarespaceDomainTransferRequest.primary).toEqual([
          'domain',
        ]);
      });
    });
  });
});
