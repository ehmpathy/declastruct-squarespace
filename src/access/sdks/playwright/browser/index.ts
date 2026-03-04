/**
 * .what - Barrel export for browser management utilities
 * .why - Single import point for browser operations
 */
export {
  findOrCreateLoggedInBrowser,
  type LoggedInBrowser,
} from './findOrCreateLoggedInBrowser';
export { getNewLoggedInBrowserPage } from './getNewLoggedInBrowserPage';
