import { deserialize, serialize } from 'domain-objects';
import { asHashSha256 } from 'hash-fns';
import type { SimpleOnDiskCache } from 'simple-on-disk-cache';
import { createRemoteStateCacheContext } from 'with-remote-state-cache';

import type { ContextSquarespaceAgent } from '@src/domain.objects/ContextSquarespaceAgent';
import { DeclaredSquarespaceDomainDnsRecord } from '@src/domain.objects/DeclaredSquarespaceDomainDnsRecord';
import { DeclaredSquarespaceDomainNameservers } from '@src/domain.objects/DeclaredSquarespaceDomainNameservers';
import { DeclaredSquarespaceDomainRegistration } from '@src/domain.objects/DeclaredSquarespaceDomainRegistration';
import { DeclaredSquarespaceDomainTransferRequest } from '@src/domain.objects/DeclaredSquarespaceDomainTransferRequest';

/**
 * .what - Remote state caching context for Squarespace domain operations
 * .why - Enables caching of query results with automatic invalidation on mutations
 */
const remoteStateCacheContext = createRemoteStateCacheContext<
  [any, ContextSquarespaceAgent],
  SimpleOnDiskCache
>({
  // Extract cache from agent options
  cache: ({ fromInput }) => fromInput[1].agentOptions.remoteState.cache,

  serialize: {
    // Create a unique, observable cache key
    // .note - KeySerializationMethod expects positional args (input, context), not { forInput }
    key: (input: any, context: ContextSquarespaceAgent) => {
      const key = [
        // Namespace to the account (hashed email)
        asHashSha256(context.agentOptions.account.email).slice(0, 12),

        // Preview of key-value pairs for observability
        JSON.stringify(input)
          .replace(/[{}[\]:,]/gi, '_')
          .replace(/[^0-9a-z_]/gi, '')
          .replace(/__+/g, '_')
          .slice(0, 100)
          .replace(/^_/, '')
          .replace(/_$/, ''),

        // Unique hash suffix
        asHashSha256(JSON.stringify(input)),

        // Serialization version (bump on schema changes)
        'v1',
      ].join('.');
      return key;
    },

    // Serialize domain objects losslessly
    value: (output) => serialize(output, { lossless: true }),
  },

  deserialize: {
    // Deserialize with domain object type information
    value: (cached) => {
      return deserialize(cached, {
        with: [
          DeclaredSquarespaceDomainRegistration,
          DeclaredSquarespaceDomainDnsRecord,
          DeclaredSquarespaceDomainNameservers,
          DeclaredSquarespaceDomainTransferRequest,
        ],
      });
    },
  },
});

/**
 * .note - re-export via any to avoid TS4023 error
 *         the underlying type uses WithRemoteStateCacheOptions which isn't exported from the package
 *         type safety is preserved at usage sites via function parameter types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const withRemoteStateQueryCache: any =
  remoteStateCacheContext.withRemoteStateQueryCache;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const withRemoteStateMutationRegistration: any =
  remoteStateCacheContext.withRemoteStateMutationRegistration;
