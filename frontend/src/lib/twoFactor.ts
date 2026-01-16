import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';

/**
 * Generate a new 2FA secret for a user
 */
export function generateTwoFactorSecret(username: string): {
  secret: string;
  otpauthUrl: string;
} {
  const secret = speakeasy.generateSecret({
    name: `AlgoEdge (${username})`,
    issuer: 'AlgoEdge',
    length: 32,
  });

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url || '',
  };
}

/**
 * Generate QR code as data URL for the 2FA secret
 */
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  try {
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: 'H', // High error correction
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify a 2FA token against a secret
 */
export function verifyTwoFactorToken(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2, // Allow 2 time steps before/after for clock drift
  });
}

/**
 * Generate cryptographically secure backup codes for 2FA recovery
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8 random bytes and convert to base36 (alphanumeric)
    const randomBytes = crypto.randomBytes(8);
    const code = randomBytes.toString('hex').substring(0, 8).toUpperCase();
    // Format as XXXX-XXXX
    const formattedCode = `${code.substring(0, 4)}-${code.substring(4, 8)}`;
    codes.push(formattedCode);
  }
  return codes;
}
