import { DeclaredSquarespaceDomainDnsRecordDao } from '../../access/daos/DeclaredSquarespaceDomainDnsRecordDao';
import { DeclaredSquarespaceDomainRegistrationDao } from '../../access/daos/DeclaredSquarespaceDomainRegistrationDao';
import { DeclaredSquarespaceDomainTransferRequestDao } from '../../access/daos/DeclaredSquarespaceDomainTransferRequestDao';
import { getSquarespaceAgentOptions } from '../../access/sdks/squarespace.via.playwright/getSquarespaceAgentOptions';
import type { ContextSquarespaceAgent } from '../../domain.objects/ContextSquarespaceAgent';

/**
 * .what = factory to create a Declastruct Squarespace provider
 * .why = provides a unified interface for domain transfer operations
 */
export const getDeclastructSquarespaceProvider = (input: {
  /**
   * account configuration
   */
  account: {
    /**
     * unique identifier for the account (used for cache namespacing)
     */
    id: string;

    /**
     * account email (for display/logging)
     */
    email: string;
  };

  /**
   * login credentials for Squarespace
   */
  credentials: {
    email: string;
    password: string;

    /**
     * TOTP secret for 2FA (optional)
     */
    totpSecret?: string;
  };

  /**
   * optional cache configuration
   */
  cache?: {
    /**
     * directory for persistent cache storage
     * @default '.cache/squarespace'
     */
    directory?: string;
  };

  /**
   * optional browser configuration
   */
  browser?: {
    /**
     * extant browser WebSocket endpoint to connect to
     */
    extantBrowserWSEndpoint?: string;
  };

  /**
   * optional session persistence configuration
   */
  session?: {
    /**
     * path to persist browser session (cookies, localStorage)
     * .why - enables session reuse across test runs, reduces login frequency
     */
    storageStatePath?: string;
  };
}) => {
  // create agent options with sensible defaults
  const agentOptions = getSquarespaceAgentOptions({
    account: input.account,
    credentials: {
      email: input.credentials.email,
      password: input.credentials.password,
      totp: input.credentials.totpSecret
        ? { secret: input.credentials.totpSecret }
        : undefined,
    },
    cache: input.cache,
    browser: input.browser,
    session: input.session,
  });

  // create context for DAO operations
  const context: ContextSquarespaceAgent = {
    agentOptions,
  };

  // return provider with DAOs and context
  return {
    /**
     * context for direct operation calls
     */
    context,

    /**
     * DAOs for declarative resource management
     */
    daos: {
      DeclaredSquarespaceDomainRegistration:
        DeclaredSquarespaceDomainRegistrationDao,
      DeclaredSquarespaceDomainDnsRecord: DeclaredSquarespaceDomainDnsRecordDao,
      DeclaredSquarespaceDomainTransferRequest:
        DeclaredSquarespaceDomainTransferRequestDao,
    },
  };
};

/**
 * .what = type for the Squarespace provider
 * .why = enables type inference for consumers
 */
export type DeclastructSquarespaceProvider = ReturnType<
  typeof getDeclastructSquarespaceProvider
>;
