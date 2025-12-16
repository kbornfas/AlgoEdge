import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateRandomToken } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';
import { z } from 'zod';

const requestResetSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

/**
 * POST /api/auth/reset-password
 * Request password reset or reset password with token
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if this is a reset request or password reset
    if ('token' in body && 'password' in body) {
      // Reset password with token
      const validatedData = resetPasswordSchema.parse(body);

      const user = await prisma.user.findFirst({
        where: {
          resetToken: validatedData.token,
          resetExpires: {
            gt: new Date(),
          },
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 400 }
        );
      }

      // Hash new password
      const passwordHash = await hashPassword(validatedData.password);

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetToken: null,
          resetExpires: null,
        },
      });

      return NextResponse.json({
        message: 'Password reset successfully',
      });
    } else {
      // Request password reset
      const validatedData = requestResetSchema.parse(body);

      const user = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (!user) {
        // Don't reveal if email exists
        return NextResponse.json({
          message: 'If the email exists, a password reset link has been sent.',
        });
      }

      // Generate reset token
      const resetToken = generateRandomToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetExpires,
        },
      });

      // Send reset email
      try {
        await sendPasswordResetEmail(user.email, user.username, resetToken);
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
        // Don't fail the request if email fails
      }

      return NextResponse.json({
        message: 'If the email exists, a password reset link has been sent.',
      });
    }
  } catch (error) {
    console.error('Password reset error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Password reset failed. Please try again.' },
      { status: 500 }
    );
  }
}
