import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/middleware';
import { verifyTwoFactorToken } from '@/lib/twoFactor';
import { z } from 'zod';

const verifySchema = z.object({
  token: z.string().length(6),
});

/**
 * POST /api/auth/2fa/verify
 * Verify 2FA token and enable 2FA for user
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = verifySchema.parse(body);

    // Get user with 2FA secret
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!dbUser || !dbUser.twoFaSecret) {
      return NextResponse.json(
        { error: 'Two-factor authentication not set up' },
        { status: 400 }
      );
    }

    // Verify token
    const isValid = verifyTwoFactorToken(validatedData.token, dbUser.twoFaSecret);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: user.userId },
      data: { twoFaEnabled: true },
    });

    return NextResponse.json({
      message: 'Two-factor authentication enabled successfully',
    });
  } catch (error) {
    console.error('2FA verification error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid verification code format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to verify two-factor authentication' },
      { status: 500 }
    );
  }
}
