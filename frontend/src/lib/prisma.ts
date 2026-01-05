import { PrismaClient } from '@prisma/client';
import { validateEnvironmentOrThrow } from './env-validator';

// Validate environment variables before initializing Prisma
// Skip validation during builds (Vercel, CI, or when SKIP_ENV_VALIDATION is set)
if (
  typeof window === 'undefined' && 
  process.env.VERCEL !== '1' && 
  process.env.CI !== 'true' &&
  process.env.SKIP_ENV_VALIDATION !== 'true'
) {
  // Only validate at runtime, not during builds
  try {
    validateEnvironmentOrThrow();
  } catch (error) {
    console.error('Environment validation warning:', error);
    // Don't throw during build - only warn
    if (process.env.NODE_ENV === 'production' && !process.env.SKIP_ENV_VALIDATION) {
      // Allow build to continue even in production if we're still building
      if (!process.env.NEXT_PHASE || process.env.NEXT_PHASE !== 'phase-production-build') {
        throw error;
      }
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
