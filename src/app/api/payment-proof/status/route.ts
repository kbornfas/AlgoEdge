import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Mark as dynamic route since it uses authentication headers
export const dynamic = 'force-dynamic';

/**
 * GET /api/payment-proof/status
 * Get payment proof status for current user
 */
export async function GET(req: NextRequest) {
  try {
    // Verify user token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token) as any;

    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user payment status
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        paymentStatus: true,
        paymentProofUrl: true,
        paymentSubmittedAt: true,
        isActivated: true,
        activatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get payment proofs
    const paymentProofs = await prisma.paymentProof.findMany({
      where: { userId: decoded.userId },
      orderBy: { submittedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        proofUrl: true,
        amount: true,
        status: true,
        notes: true,
        submittedAt: true,
        reviewedAt: true,
      },
    });

    return NextResponse.json({
      paymentStatus: user.paymentStatus,
      isActivated: user.isActivated,
      activatedAt: user.activatedAt,
      paymentSubmittedAt: user.paymentSubmittedAt,
      paymentProofs,
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment status' },
      { status: 500 }
    );
  }
}
