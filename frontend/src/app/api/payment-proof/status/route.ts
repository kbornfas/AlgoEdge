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
    const paymentProofs = await prisma.payment_proofs.findMany({
      where: { user_id: decoded.userId },
      orderBy: { submitted_at: 'desc' },
      take: 5,
      select: {
        id: true,
        proof_url: true,
        amount: true,
        status: true,
        notes: true,
        submitted_at: true,
        reviewed_at: true,
      },
    });

    return NextResponse.json({
      paymentStatus: user.paymentStatus,
      isActivated: user.isActivated,
      activatedAt: user.activatedAt,
      paymentSubmittedAt: user.paymentSubmittedAt,
      paymentProofs: paymentProofs.map(p => ({
        id: p.id,
        proofUrl: p.proof_url,
        amount: p.amount,
        status: p.status,
        notes: p.notes,
        submittedAt: p.submitted_at,
        reviewedAt: p.reviewed_at,
      })),
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment status' },
      { status: 500 }
    );
  }
}
