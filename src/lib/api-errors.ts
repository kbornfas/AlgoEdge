/**
 * API Error Handling Utilities
 * 
 * Shared utilities for consistent error handling across API routes
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Format Zod validation errors into user-friendly messages
 */
export function formatValidationErrors(error: z.ZodError): { field: string; message: string }[] {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

/**
 * Handle Zod validation error and return appropriate response
 */
export function handleValidationError(error: z.ZodError, context: string = 'input') {
  const fieldErrors = formatValidationErrors(error);
  
  console.error(`${context} validation errors:`, fieldErrors);
  
  return NextResponse.json(
    { 
      error: `Invalid ${context} data. Please check the form fields.`,
      details: fieldErrors,
    },
    { status: 400 }
  );
}

/**
 * Handle Prisma database errors and return appropriate response
 */
export function handlePrismaError(error: unknown, context: string = 'operation') {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return null; // Not a Prisma error
  }

  const prismaError = error as { code: string; meta?: { target?: string[] } };
  
  switch (prismaError.code) {
    case 'P2002':
      // Unique constraint violation
      const field = prismaError.meta?.target?.[0] || 'field';
      console.error(`Unique constraint violation on field: ${field} during ${context}`);
      return NextResponse.json(
        { error: `This ${field} is already registered. Please use a different ${field}.` },
        { status: 400 }
      );
      
    case 'P2003':
      // Foreign key constraint violation
      console.error(`Foreign key constraint violation during ${context}:`, prismaError);
      return NextResponse.json(
        { error: 'Database constraint error. Please contact support.' },
        { status: 500 }
      );
      
    case 'P1001':
      // Can't reach database server
      console.error(`Cannot reach database server during ${context}:`, prismaError);
      return NextResponse.json(
        { error: 'Database connection failed. Please try again later.' },
        { status: 503 }
      );
      
    case 'P1002':
      // Database server timeout
      console.error(`Database server timeout during ${context}:`, prismaError);
      return NextResponse.json(
        { error: 'Database timeout. Please try again.' },
        { status: 503 }
      );
      
    case 'P2024':
      // Connection pool timeout
      console.error(`Connection pool timeout during ${context}:`, prismaError);
      return NextResponse.json(
        { error: 'Server is busy. Please try again in a moment.' },
        { status: 503 }
      );
      
    default:
      console.error(`Prisma error during ${context}:`, prismaError.code, prismaError);
      return NextResponse.json(
        { error: 'Database error occurred. Please try again.' },
        { status: 500 }
      );
  }
}

/**
 * Handle generic errors with logging and return appropriate response
 */
export function handleGenericError(error: unknown, context: string = 'operation') {
  console.error(`Unexpected error during ${context}:`, {
    name: error instanceof Error ? error.name : 'Unknown',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  return NextResponse.json(
    { error: `${context} failed. Please try again or contact support if the problem persists.` },
    { status: 500 }
  );
}

/**
 * Comprehensive error handler for API routes
 * Handles Zod validation, Prisma, and generic errors
 */
export function handleApiError(error: unknown, context: string = 'operation') {
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return handleValidationError(error, context);
  }

  // Handle Prisma errors
  const prismaResponse = handlePrismaError(error, context);
  if (prismaResponse) {
    return prismaResponse;
  }

  // Handle generic errors
  return handleGenericError(error, context);
}
