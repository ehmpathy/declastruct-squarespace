import * as OTPAuth from 'otpauth';

/**
 * .what - Generate a TOTP code from a base32 secret
 * .why - Enables automated 2FA authentication for Squarespace
 */
export const generateTotpCode = (secret: string): string => {
  const totp = new OTPAuth.TOTP({
    issuer: 'Squarespace',
    label: 'Squarespace',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  return totp.generate();
};
