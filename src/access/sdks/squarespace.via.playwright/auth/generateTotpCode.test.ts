import { given, then, when } from 'test-fns';

import { generateTotpCode } from './generateTotpCode';

describe('generateTotpCode', () => {
  given('a valid base32 TOTP secret', () => {
    // valid base32 test secret (commonly used for testing)
    const validSecret = 'JBSWY3DPEHPK3PXP';

    when('generating a TOTP code', () => {
      then('should return a 6-digit numeric string', () => {
        const code = generateTotpCode(validSecret);

        expect(code).toMatch(/^\d{6}$/);
      });

      then('should return consistent codes for same time window', () => {
        // within the same 30-second window, codes should be identical
        const code1 = generateTotpCode(validSecret);
        const code2 = generateTotpCode(validSecret);

        expect(code1).toEqual(code2);
      });
    });
  });

  given('different TOTP secrets', () => {
    const secretA = 'JBSWY3DPEHPK3PXP';
    const secretB = 'GEZDGNBVGY3TQOJQ';

    when('generating codes', () => {
      then('should produce different codes for different secrets', () => {
        const codeA = generateTotpCode(secretA);
        const codeB = generateTotpCode(secretB);

        // very unlikely to be equal at same time with different secrets
        expect(codeA).not.toEqual(codeB);
      });
    });
  });

  given('an empty secret', () => {
    when('generating a TOTP code', () => {
      then('should still return a 6-digit code', () => {
        // otpauth library handles empty secrets gracefully
        const code = generateTotpCode('');
        expect(code).toMatch(/^\d{6}$/);
      });
    });
  });
});
