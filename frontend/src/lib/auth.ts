import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Authentication Configuration Constants
export const OTP_LENGTH = 6;
export const OTP_EXPIRATION_MINUTES = 15;
export const PASSWORD_MIN_LENGTH = 8;
export const BCRYPT_SALT_ROUNDS = 12;

const JWT_SECRET = process.env.JWT_SECRET;

// Warn if JWT_SECRET is not set, but allow fallback for development
if (!JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set. Using development fallback. DO NOT use in production!');
}

// Use fallback for development/build, but log warning
const SECRET = JWT_SECRET || 'dev-only-secret-DO-NOT-USE-IN-PRODUCTION';

export interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  isAdmin?: boolean;
}

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate cryptographically secure random token
 * Used for email verification, password reset, etc.
 */
export function generateRandomToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate random numeric code (for verification codes, etc.)
 */
export function generateNumericCode(length: number = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const randomBuffer = crypto.randomBytes(4);
  const randomNumber = randomBuffer.readUInt32BE(0);
  return (min + (randomNumber % (max - min + 1))).toString();
}
