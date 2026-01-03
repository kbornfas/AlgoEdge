import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken, PASSWORD_MIN_LENGTH } from '@/lib/auth';
import { z } from 'zod';

// Subscription constants
const DEFAULT_SUBSCRIPTION_PLAN = 'standard';
const DEFAULT_SUBSCRIPTION_STATUS = 'pending';

// Validation schema for registration - Updated to require first and last name
const registerSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(PASSWORD_MIN_LENGTH),
  phone: z.string().optional(),
  country: z.string().optional(),
});

/**
 * POST /api/auth/register
 * Register a new user account
 * Step 1 of onboarding flow: Create account, then redirect to OTP verification
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);

    // Create username from first and last name
    const baseUsername = `${validatedData.firstName.toLowerCase()}${validatedData.lastName.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;
    
    // Ensure username is unique
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create full name from first and last name
    const fullName = `${validatedData.firstName} ${validatedData.lastName}`;

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email: validatedData.email,
        passwordHash,
        fullName,
        phone: validatedData.phone,
        country: validatedData.country,
        isVerified: false, // Will be verified via OTP
        approvalStatus: 'pending', // Requires admin approval after payment
      },
    });

    // Create subscription record
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: DEFAULT_SUBSCRIPTION_PLAN,
        status: DEFAULT_SUBSCRIPTION_STATUS,
      },
    });

    // Create default user settings
    await prisma.userSettings.create({
      data: {
        userId: user.id,
      },
    });

    // Don't send verification email - will send OTP instead when user requests it
    // Verification email sending removed - using OTP flow instead

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    return NextResponse.json(
      {
        message: 'Registration successful. Please verify your email with OTP.',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isVerified: user.isVerified,
          requiresOTP: true, // Signal frontend to show OTP page
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      console.error('Validation errors:', fieldErrors);
      
      return NextResponse.json(
        { 
          error: 'Invalid input data. Please check the form fields.',
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: { target?: string[] } };
      
      switch (prismaError.code) {
        case 'P2002':
          // Unique constraint violation
          const field = prismaError.meta?.target?.[0] || 'field';
          console.error(`Unique constraint violation on field: ${field}`);
          return NextResponse.json(
            { error: `This ${field} is already registered. Please use a different ${field}.` },
            { status: 400 }
          );
          
        case 'P2003':
          // Foreign key constraint violation
          console.error('Foreign key constraint violation:', prismaError);
          return NextResponse.json(
            { error: 'Database constraint error. Please contact support.' },
            { status: 500 }
          );
          
        case 'P1001':
          // Can't reach database server
          console.error('Cannot reach database server:', prismaError);
          return NextResponse.json(
            { error: 'Database connection failed. Please try again later.' },
            { status: 503 }
          );
          
        case 'P1002':
          // Database server timeout
          console.error('Database server timeout:', prismaError);
          return NextResponse.json(
            { error: 'Database timeout. Please try again.' },
            { status: 503 }
          );
          
        case 'P2024':
          // Connection pool timeout
          console.error('Connection pool timeout:', prismaError);
          return NextResponse.json(
            { error: 'Server is busy. Please try again in a moment.' },
            { status: 503 }
          );
          
        default:
          console.error('Prisma error:', prismaError.code, prismaError);
          return NextResponse.json(
            { error: 'Database error occurred. Please try again.' },
            { status: 500 }
          );
      }
    }

    // Handle generic errors
    console.error('Unexpected registration error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Registration failed. Please try again or contact support if the problem persists.' },
      { status: 500 }
    );
  }
}
