import { PrismaClient } from '@prisma/client';
import { validateEnvironmentOrThrow } from './env-validator';

// Validate environment variables before initializing Prisma
// Skip validation during Vercel builds, validate at runtime otherwise
if (typeof window === 'undefined' && process.env.VERCEL !== '1') {
  // Skip validation during Vercel build
  try {
    validateEnvironmentOrThrow();
  } catch (error) {
    console.error('Environment validation warning:', error);
    // Don't throw during build - only warn
    if (process.env.NODE_ENV === 'production' && !process.env.SKIP_ENV_VALIDATION) {
      throw error;
    }
  }
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
