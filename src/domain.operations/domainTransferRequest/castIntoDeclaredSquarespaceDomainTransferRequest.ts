import type { RawTransferRequest } from '../../access/sdks/playwright/transfersList/scrapeTransferRequests';
import { DeclaredSquarespaceDomainTransferRequest } from '../../domain.objects/DeclaredSquarespaceDomainTransferRequest';
import type { DeclaredSquarespaceTransferRequestStatus } from '../../domain.objects/literals/DeclaredSquarespaceTransferRequestStatus';

/**
 * .what = maps raw scraped status string to domain status enum
 * .why = normalizes various status text values to canonical domain values
 */
const mapRawStatusToTransferStatus = (input: {
  rawStatus: string;
  direction: string | null;
}): DeclaredSquarespaceTransferRequestStatus => {
  const { rawStatus, direction } = input;
  const status = rawStatus.toLowerCase();

  // handle completed state
  if (status.includes('complete') || status.includes('transferred'))
    return 'COMPLETED';

  // handle cancelled state
  if (status.includes('cancel') || status.includes('failed'))
    return 'CANCELLED';

  // handle in-progress state
  if (status.includes('progress') || status.includes('pending'))
    return 'IN_PROGRESS';

  // handle code sent state
  if (status.includes('code') || status.includes('sent')) return 'CODE_SENT';

  // default to requested for outbound transfers
  if (direction?.toLowerCase().includes('out')) return 'REQUESTED';

  return 'REQUESTED';
};

/**
 * .what = casts raw transfer request data into a DeclaredSquarespaceDomainTransferRequest
 * .why = transforms scraped data into typed domain entity for consistent handling
 */
export const castIntoDeclaredSquarespaceDomainTransferRequest = (input: {
  raw: RawTransferRequest;
}): DeclaredSquarespaceDomainTransferRequest => {
  const { raw } = input;

  // derive requestedAt from initiatedDate or use current time
  const requestedAt = raw.initiatedDate
    ? new Date(raw.initiatedDate).toISOString()
    : new Date().toISOString();

  // map status to domain enum
  const status = mapRawStatusToTransferStatus({
    rawStatus: raw.status,
    direction: raw.direction,
  });

  return new DeclaredSquarespaceDomainTransferRequest({
    domain: { name: raw.domainName },
    requestedAt,
    status,
  });
};
