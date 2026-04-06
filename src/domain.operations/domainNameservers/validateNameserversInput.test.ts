import { BadRequestError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { validateNameserversInput } from './validateNameserversInput';

describe('validateNameserversInput', () => {
  given('[case1] valid nameservers', () => {
    when('2 nameservers', () => {
      then('passes validation', () => {
        const result = validateNameserversInput({
          nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
        });
        expect(result).toEqual(['ns1.cloudflare.com', 'ns2.cloudflare.com']);
      });

      then('result matches snapshot', () => {
        const result = validateNameserversInput({
          nameservers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
        });
        expect(result).toMatchSnapshot();
      });
    });

    when('13 nameservers (max allowed)', () => {
      const nameservers = Array.from(
        { length: 13 },
        (_, i) => `ns${i + 1}.example.com`,
      );

      then('passes validation', () => {
        const result = validateNameserversInput({ nameservers });
        expect(result).toHaveLength(13);
      });
    });
  });

  given('[case2] fewer than 2 nameservers', () => {
    when('1 nameserver', () => {
      then(
        'throws BadRequestError with "nameservers must have at least 2 entries" message',
        () => {
          expect(() =>
            validateNameserversInput({ nameservers: ['ns1.cloudflare.com'] }),
          ).toThrow(BadRequestError);

          try {
            validateNameserversInput({ nameservers: ['ns1.cloudflare.com'] });
          } catch (error) {
            expect(error).toBeInstanceOf(BadRequestError);
            expect((error as Error).message).toContain(
              'nameservers must have at least 2 entries',
            );
          }
        },
      );

      then('error message matches snapshot', () => {
        try {
          validateNameserversInput({ nameservers: ['ns1.cloudflare.com'] });
        } catch (error) {
          expect((error as Error).message).toMatchSnapshot();
        }
      });
    });
  });

  given('[case3] invalid FQDN format', () => {
    when('nameserver with invalid characters', () => {
      then(
        'throws BadRequestError with "invalid nameserver format" message',
        () => {
          expect(() =>
            validateNameserversInput({
              nameservers: ['ns1.cloudflare.com', 'invalid_ns!.com'],
            }),
          ).toThrow(BadRequestError);

          try {
            validateNameserversInput({
              nameservers: ['ns1.cloudflare.com', 'invalid_ns!.com'],
            });
          } catch (error) {
            expect(error).toBeInstanceOf(BadRequestError);
            expect((error as Error).message).toContain(
              'invalid nameserver format',
            );
          }
        },
      );

      then('error message matches snapshot', () => {
        try {
          validateNameserversInput({
            nameservers: ['ns1.cloudflare.com', 'invalid_ns!.com'],
          });
        } catch (error) {
          expect((error as Error).message).toMatchSnapshot();
        }
      });
    });

    when('nameserver starts with hyphen', () => {
      then('throws BadRequestError', () => {
        expect(() =>
          validateNameserversInput({
            nameservers: ['ns1.cloudflare.com', '-invalid.com'],
          }),
        ).toThrow(BadRequestError);
      });

      then('error message matches snapshot', () => {
        try {
          validateNameserversInput({
            nameservers: ['ns1.cloudflare.com', '-invalid.com'],
          });
        } catch (error) {
          expect((error as Error).message).toMatchSnapshot();
        }
      });
    });
  });

  given('[case4] empty array', () => {
    when('nameservers is empty array', () => {
      then('treated as null (squarespace default)', () => {
        const result = validateNameserversInput({ nameservers: [] });
        expect(result).toBeNull();
      });

      then('result matches snapshot', () => {
        const result = validateNameserversInput({ nameservers: [] });
        expect(result).toMatchSnapshot();
      });
    });

    when('nameservers is null', () => {
      then('returns null', () => {
        const result = validateNameserversInput({ nameservers: null });
        expect(result).toBeNull();
      });

      then('result matches snapshot', () => {
        const result = validateNameserversInput({ nameservers: null });
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case5] more than 13 nameservers', () => {
    when('14 nameservers', () => {
      const nameservers = Array.from(
        { length: 14 },
        (_, i) => `ns${i + 1}.example.com`,
      );

      then(
        'throws BadRequestError with "nameservers cannot exceed 13 entries" message',
        () => {
          expect(() => validateNameserversInput({ nameservers })).toThrow(
            BadRequestError,
          );

          try {
            validateNameserversInput({ nameservers });
          } catch (error) {
            expect(error).toBeInstanceOf(BadRequestError);
            expect((error as Error).message).toContain(
              'nameservers cannot exceed 13 entries',
            );
          }
        },
      );

      then('error message matches snapshot', () => {
        try {
          validateNameserversInput({ nameservers });
        } catch (error) {
          expect((error as Error).message).toMatchSnapshot();
        }
      });
    });
  });
});
