/**
 * .what - Barrel export for authentication utilities
 * .why - Single import point for auth operations
 */
export { generateTotpCode } from './generateTotpCode';
export {
  handleReauthentication,
  isReauthenticationRequired,
} from './handleReauthentication';
export { performSquarespaceLogin } from './performSquarespaceLogin';
export { authSelectors } from './selectors';
