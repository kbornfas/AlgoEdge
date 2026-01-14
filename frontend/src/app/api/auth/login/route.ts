import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';
import { handleApiError } from '@/lib/api-errors';
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

    // Check if user is activated (payment approved)
    // Users with rejected approval status cannot login
    if (user.approvalStatus === 'rejected') {
      return NextResponse.json(
        {
          error: user.rejectionReason || 'Account has been rejected by admin. Please contact support.',
          isRejected: true,
        },
        { status: 403 }
      );
    }

    if (!user.isActivated || user.approvalStatus !== 'approved') {
      return NextResponse.json(
        {
          error: 'Account not activated. Please complete email verification, submit payment proof, and wait for admin approval.',
          requiresActivation: true,
          paymentStatus: user.paymentStatus,
          approvalStatus: user.approvalStatus,
          isVerified: user.isVerified,
        },
        { status: 403 }
      );
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

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        isVerified: user.isVerified,
        isActivated: user.isActivated,
        twoFaEnabled: user.twoFaEnabled,
        paymentStatus: user.paymentStatus,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return handleApiError(error, 'Login');
  }
}
