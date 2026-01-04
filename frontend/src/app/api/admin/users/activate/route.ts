import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const activateSchema = z.object({
  userId: z.number(),
  activate: z.boolean(),
  rejectionReason: z.string().optional(),
});

/**
 * POST /api/admin/users/activate
 * Approve or reject a user
 * Approve: Activate user and grant access
 * Reject: Mark user as rejected and block login
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
    const { userId, activate, rejectionReason } = activateSchema.parse(body);

    // Update user activation and approval status
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isActivated: activate,
        approvalStatus: activate ? 'approved' : 'rejected',
        activatedAt: activate ? new Date() : null,
        activatedBy: activate ? decoded.userId : null,
        paymentStatus: activate ? 'approved' : 'rejected',
        rejectionReason: activate ? null : rejectionReason,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: activate ? 'USER_APPROVED' : 'USER_REJECTED',
        details: {
          targetUserId: userId,
          targetEmail: user.email,
          rejectionReason: activate ? undefined : rejectionReason,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
      },
    });

    return NextResponse.json({
      message: activate ? 'User approved successfully' : 'User rejected',
      user: {
        id: user.id,
        email: user.email,
        isActivated: user.isActivated,
        approvalStatus: user.approvalStatus,
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
