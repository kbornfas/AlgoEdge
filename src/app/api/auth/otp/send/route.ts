import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateNumericCode } from '@/lib/auth';
import { sendOTPEmail } from '@/lib/email';
import { z } from 'zod';

const sendOTPSchema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/auth/otp/send
 * Send OTP verification code to user's email
 * Used during registration email verification
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = sendOTPSchema.parse(body);

    // Check if user exists (must exist to send OTP)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true, isVerified: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If already verified, don't send OTP
    if (user.isVerified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP code
    const code = generateNumericCode(6);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store OTP in VerificationCode table
    await prisma.verificationCode.upsert({
      where: {
        email_type: {
          email: user.email,
          type: 'registration_otp',
        },
      },
      update: {
        code,
        expiresAt,
        used: false,
      },
      create: {
        email: user.email,
        code,
        type: 'registration_otp',
        expiresAt,
      },
    });

    // Send OTP email
    try {
      await sendOTPEmail(user.email, user.username, code);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Verification code sent successfully',
      email: user.email,
    });
  } catch (error) {
    console.error('Send OTP error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}
