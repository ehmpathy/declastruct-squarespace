/**
 * .what = public SDK exports for declastruct-squarespace package
 * .why = enables consumers to use the declastruct provider interface and domain objects
 */

// provider
export {
  getDeclastructSquarespaceProvider,
  type DeclastructSquarespaceProvider,
} from '../../domain.operations/provider/getDeclastructSquarespaceProvider';

// context types
export type { ContextSquarespaceAgent } from '../../domain.objects/ContextSquarespaceAgent';

// domain objects
export { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';
export { DeclaredSquarespaceDomainDnsRecord } from '../../domain.objects/DeclaredSquarespaceDomainDnsRecord';
export { DeclaredSquarespaceDomainTransferRequest } from '../../domain.objects/DeclaredSquarespaceDomainTransferRequest';

// literals
export type { DeclaredSquarespaceDomainRegistrationStatus } from '../../domain.objects/literals/DeclaredSquarespaceDomainRegistrationStatus';
export type { DeclaredSquarespaceDomainLockReason } from '../../domain.objects/literals/DeclaredSquarespaceDomainLockReason';
export type { DeclaredSquarespaceDomainDnsRecordType } from '../../domain.objects/literals/DeclaredSquarespaceDomainDnsRecordType';
export type { DeclaredSquarespaceRegistrarType } from '../../domain.objects/literals/DeclaredSquarespaceRegistrarType';
export type { DeclaredSquarespaceTransferRequestStatus } from '../../domain.objects/literals/DeclaredSquarespaceTransferRequestStatus';
