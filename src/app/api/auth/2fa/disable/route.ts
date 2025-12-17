import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/middleware';
import { verifyTwoFactorToken } from '@/lib/twoFactor';
import { z } from 'zod';

const disableSchema = z.object({
  token: z.string().length(6),
});

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA for user (requires valid 2FA token)
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
    const validatedData = disableSchema.parse(body);

    // Get user with 2FA secret
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!dbUser || !dbUser.twoFaEnabled || !dbUser.twoFaSecret) {
      return NextResponse.json(
        { error: 'Two-factor authentication is not enabled' },
        { status: 400 }
      );
    }

    // Verify token before disabling
    const isValid = verifyTwoFactorToken(validatedData.token, dbUser.twoFaSecret);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Disable 2FA and clear secret
    await prisma.user.update({
      where: { id: user.userId },
      data: {
        twoFaEnabled: false,
        twoFaSecret: null,
      },
    });

    return NextResponse.json({
      message: 'Two-factor authentication disabled successfully',
    });
  } catch (error) {
    console.error('2FA disable error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid verification code format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to disable two-factor authentication' },
      { status: 500 }
    );
  }
}
