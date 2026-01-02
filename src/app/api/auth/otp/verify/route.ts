import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OTP_LENGTH } from '@/lib/auth';
import { z } from 'zod';

const verifyOTPSchema = z.object({
  email: z.string().email(),
  code: z.string().length(OTP_LENGTH),
});

/**
 * POST /api/auth/otp/verify
 * Verify OTP code submitted by user
 * Marks user as verified and allows proceeding to payment
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = verifyOTPSchema.parse(body);

    // Find the verification code
    const verificationRecord = await prisma.verificationCode.findUnique({
      where: {
        email_type: {
          email,
          type: 'registration_otp',
        },
      },
    });

    if (!verificationRecord) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new code.' },
        { status: 404 }
      );
    }

    // Check if code is expired
    if (verificationRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check if code is already used
    if (verificationRecord.used) {
      return NextResponse.json(
        { error: 'Verification code has already been used.' },
        { status: 400 }
      );
    }

    // Check if code matches
    if (verificationRecord.code !== code) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please try again.' },
        { status: 400 }
      );
    }

    // Mark verification code as used
    await prisma.verificationCode.update({
      where: {
        email_type: {
          email,
          type: 'registration_otp',
        },
      },
      data: {
        used: true,
      },
    });

    // Update user as verified
    const user = await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
      },
    });

    // Log the verification action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EMAIL_VERIFIED',
        details: {
          method: 'OTP',
          email: user.email,
        },
      },
    });

    return NextResponse.json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
