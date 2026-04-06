/**
 * .what = public SDK exports for declastruct-squarespace package
 * .why = enables consumers to use the declastruct provider interface and domain objects
 */

// context types
export type { ContextSquarespaceAgent } from '../../domain.objects/ContextSquarespaceAgent';
export { DeclaredSquarespaceDomainDnsRecord } from '../../domain.objects/DeclaredSquarespaceDomainDnsRecord';
export { DeclaredSquarespaceDomainNameservers } from '../../domain.objects/DeclaredSquarespaceDomainNameservers';
// domain objects
export { DeclaredSquarespaceDomainRegistration } from '../../domain.objects/DeclaredSquarespaceDomainRegistration';
export { DeclaredSquarespaceDomainTransferRequest } from '../../domain.objects/DeclaredSquarespaceDomainTransferRequest';
export type { DeclaredSquarespaceDomainDnsRecordType } from '../../domain.objects/literals/DeclaredSquarespaceDomainDnsRecordType';
export type { DeclaredSquarespaceDomainLockReason } from '../../domain.objects/literals/DeclaredSquarespaceDomainLockReason';
// literals
export type { DeclaredSquarespaceDomainRegistrationStatus } from '../../domain.objects/literals/DeclaredSquarespaceDomainRegistrationStatus';
export type { DeclaredSquarespaceRegistrarType } from '../../domain.objects/literals/DeclaredSquarespaceRegistrarType';
export type { DeclaredSquarespaceTransferRequestStatus } from '../../domain.objects/literals/DeclaredSquarespaceTransferRequestStatus';
// provider
export {
  type DeclastructSquarespaceProvider,
  getDeclastructSquarespaceProvider,
} from '../../domain.operations/provider/getDeclastructSquarespaceProvider';
