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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
