import { BadRequestError } from 'helpful-errors';

/**
 * .what = FQDN validation pattern per RFC 1035
 * .why = nameservers must be valid fully qualified domain names
 * .note = requires at least one dot (e.g., "ns1.example.com") to be a valid FQDN
 */
const FQDN_PATTERN = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+\.?$/i;

/**
 * .what = validates and normalizes nameservers input
 * .why = ensures nameservers meet squarespace and DNS requirements
 *
 * validation rules:
 * - null is valid (squarespace default)
 * - empty array treated as null
 * - minimum 2 nameservers required
 * - maximum 13 nameservers allowed (RFC 1035)
 * - each nameserver must be valid FQDN
 */
export const validateNameserversInput = (input: {
  nameservers: string[] | null;
}): string[] | null => {
  // null is valid (squarespace default)
  if (input.nameservers === null) return null;

  // empty array treated as null
  if (input.nameservers.length === 0) return null;

  // minimum 2 nameservers required
  if (input.nameservers.length < 2) {
    throw new BadRequestError('nameservers must have at least 2 entries', {
      count: input.nameservers.length,
      nameservers: input.nameservers,
    });
  }

  // maximum 13 nameservers allowed (RFC 1035)
  if (input.nameservers.length > 13) {
    throw new BadRequestError('nameservers cannot exceed 13 entries', {
      count: input.nameservers.length,
      hint: 'RFC 1035 limits NS records to 13',
    });
  }

  // validate each nameserver is valid FQDN
  for (const ns of input.nameservers) {
    if (!FQDN_PATTERN.test(ns)) {
      throw new BadRequestError(`invalid nameserver format: ${ns}`, {
        nameserver: ns,
        hint: 'nameserver must be a valid fully qualified domain name',
      });
    }
  }

  return input.nameservers;
};
