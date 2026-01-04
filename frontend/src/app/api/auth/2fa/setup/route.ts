import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/middleware';
import { generateTwoFactorSecret, generateQRCode } from '@/lib/twoFactor';

/**
 * POST /api/auth/2fa/setup
 * Generate 2FA secret and QR code for user
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

    // Check if 2FA is already enabled
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (dbUser.twoFaEnabled) {
      return NextResponse.json(
        { error: 'Two-factor authentication is already enabled' },
        { status: 400 }
      );
    }

    // Generate 2FA secret
    const { secret, otpauthUrl } = generateTwoFactorSecret(dbUser.username);

    // Generate QR code
    const qrCode = await generateQRCode(otpauthUrl);

    // Save secret (but don't enable 2FA yet - user must verify first)
    await prisma.user.update({
      where: { id: user.userId },
      data: { twoFaSecret: secret },
    });

    return NextResponse.json({
      secret,
      qrCode,
      message: 'Scan the QR code with your authenticator app',
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup two-factor authentication' },
      { status: 500 }
    );
  }
}
