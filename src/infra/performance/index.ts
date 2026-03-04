/**
 * .what - Barrel export for performance infrastructure
 * .why - Single import point for caching utilities
 */
export {
  withRemoteStateMutationRegistration,
  withRemoteStateQueryCache,
} from './withRemoteStateCache';
