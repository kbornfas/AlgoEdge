import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const activateSchema = z.object({
  userId: z.number(),
  activate: z.boolean(),
});

/**
 * POST /api/admin/users/activate
 * Activate or deactivate a user
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token) as any;

    if (!decoded?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, activate } = activateSchema.parse(body);

    // Update user activation status
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isActivated: activate,
        activatedAt: activate ? new Date() : null,
        activatedBy: activate ? decoded.userId : null,
        paymentStatus: activate ? 'approved' : 'pending',
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: activate ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        details: {
          targetUserId: userId,
          targetEmail: user.email,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
      },
    });

    return NextResponse.json({
      message: activate ? 'User activated successfully' : 'User deactivated',
      user: {
        id: user.id,
        email: user.email,
        isActivated: user.isActivated,
        activatedAt: user.activatedAt,
      },
    });
  } catch (error) {
    console.error('Activate user error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}
