import { PrismaClient } from '@prisma/client';
import { validateEnvironmentOrThrow } from './env-validator';

// Validate environment variables before initializing Prisma
// Skip validation during builds (Vercel, CI, or when SKIP_ENV_VALIDATION is set)
const shouldSkipValidation = 
  typeof window !== 'undefined' || // Client-side
  process.env.VERCEL === '1' || // Vercel build
  process.env.CI === 'true' || // CI environment
  process.env.SKIP_ENV_VALIDATION === 'true'; // Explicit skip flag

if (!shouldSkipValidation) {
  // Only validate at runtime in server environments
  try {
    validateEnvironmentOrThrow();
  } catch (error) {
    console.error('Environment validation warning:', error);
    // Only throw in production runtime, not during builds
    const isProductionRuntime = 
      process.env.NODE_ENV === 'production' &&
      process.env.NEXT_PHASE !== 'phase-production-build';
    
    if (isProductionRuntime) {
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
