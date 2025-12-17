import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';
import { z } from 'zod';

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFactorCode: z.string().optional(),
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const validatedData = loginSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      validatedData.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if 2FA is enabled
    if (user.twoFaEnabled) {
      if (!validatedData.twoFactorCode) {
        return NextResponse.json(
          {
            error: 'Two-factor authentication required',
            requires2FA: true,
          },
          { status: 403 }
        );
      }

      // Verify 2FA code (will be implemented in 2FA route)
      const { verifyTwoFactorToken } = await import('@/lib/twoFactor');
      const isValid = verifyTwoFactorToken(
        validatedData.twoFactorCode,
        user.twoFaSecret!
      );

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid two-factor authentication code' },
          { status: 401 }
        );
      }
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // Get user subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        isVerified: user.isVerified,
        twoFaEnabled: user.twoFaEnabled,
        subscription: subscription
          ? {
              plan: subscription.plan,
              status: subscription.status,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
