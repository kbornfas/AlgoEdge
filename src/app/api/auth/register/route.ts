import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken, generateRandomToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { z } from 'zod';

// Validation schema for registration
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
});

/**
 * POST /api/auth/register
 * Register a new user account
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            existingUser.email === validatedData.email
              ? 'Email already registered'
              : 'Username already taken',
        },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Generate verification token
    const verificationToken = generateRandomToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        username: validatedData.username,
        email: validatedData.email,
        passwordHash,
        fullName: validatedData.fullName,
        phone: validatedData.phone,
        country: validatedData.country,
        verificationToken,
        verificationExpires,
      },
    });

    // Create default subscription (free plan)
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'free',
        status: 'active',
      },
    });

    // Create default user settings
    await prisma.userSettings.create({
      data: {
        userId: user.id,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.username, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    return NextResponse.json(
      {
        message: 'Registration successful. Please check your email to verify your account.',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isVerified: user.isVerified,
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
