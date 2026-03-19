import { deserialize, serialize } from 'domain-objects';
import { asHashSha256 } from 'hash-fns';
import type { SimpleOnDiskCache } from 'simple-on-disk-cache';
import { createRemoteStateCacheContext } from 'with-remote-state-cache';

import type { ContextSquarespaceAgent } from '@src/domain.objects/ContextSquarespaceAgent';
import { DeclaredSquarespaceDomainDnsRecord } from '@src/domain.objects/DeclaredSquarespaceDomainDnsRecord';
import { DeclaredSquarespaceDomainRegistration } from '@src/domain.objects/DeclaredSquarespaceDomainRegistration';
import { DeclaredSquarespaceDomainTransferRequest } from '@src/domain.objects/DeclaredSquarespaceDomainTransferRequest';

/**
 * .what - Remote state caching context for Squarespace domain operations
 * .why - Enables caching of query results with automatic invalidation on mutations
 */
export const {
  withRemoteStateQueryCache,
  withRemoteStateMutationRegistration,
} = createRemoteStateCacheContext<
  [any, ContextSquarespaceAgent],
  SimpleOnDiskCache
>({
  // Extract cache from agent options
  cache: ({ fromInput }) => fromInput[1].agentOptions.remoteState.cache,

  serialize: {
    // Create a unique, observable cache key
    key: ({ forInput }) => {
      const key = [
        // Namespace to the account
        forInput[1].agentOptions.account.id,

        // Preview of key-value pairs for observability
        JSON.stringify(forInput[0])
          .replace(/[{}[\]:,]/gi, '_')
          .replace(/[^0-9a-z_]/gi, '')
          .replace(/__+/g, '_')
          .slice(0, 100)
          .replace(/^_/, '')
          .replace(/_$/, ''),

        // Unique hash suffix
        asHashSha256(JSON.stringify(forInput[0])),

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
          DeclaredSquarespaceDomainTransferRequest,
        ],
      });
    },
  },
});
