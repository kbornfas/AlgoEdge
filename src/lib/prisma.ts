import { PrismaClient } from '@prisma/client';
import { validateEnvironmentOrThrow } from './env-validator';

// Validate environment variables before initializing Prisma
// This ensures we fail fast with clear error messages
if (typeof window === 'undefined') {
  // Only run validation on server-side
  try {
    validateEnvironmentOrThrow();
  } catch (error) {
    // Re-throw to prevent application from starting with invalid config
    throw error;
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
