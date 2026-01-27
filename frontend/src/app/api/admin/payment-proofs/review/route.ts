import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const reviewSchema = z.object({
  proofId: z.number(),
  status: z.enum(['approved', 'rejected']),
  notes: z.string().optional(),
});

/**
 * POST /api/admin/payment-proofs/review
 * Approve or reject a payment proof
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
    const { proofId, status, notes } = reviewSchema.parse(body);

    // Get the payment proof
    const proof = await prisma.payment_proofs.findUnique({
      where: { id: proofId },
      include: { users: true },
    });

    if (!proof) {
      return NextResponse.json({ error: 'Payment proof not found' }, { status: 404 });
    }

    // Update payment proof
    const updatedProof = await prisma.payment_proofs.update({
      where: { id: proofId },
      data: {
        status,
        reviewed_by: decoded.userId,
        reviewed_at: new Date(),
        notes: notes || proof.notes,
      },
    });

    // If approved, activate the user
    if (status === 'approved') {
      await prisma.user.update({
        where: { id: proof.user_id },
        data: {
          isActivated: true,
          activatedAt: new Date(),
          activatedBy: decoded.userId,
          paymentStatus: 'approved',
        },
      });
    } else {
      // If rejected, update payment status
      await prisma.user.update({
        where: { id: proof.user_id },
        data: {
          paymentStatus: 'rejected',
        },
      });
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: status === 'approved' ? 'PAYMENT_APPROVED' : 'PAYMENT_REJECTED',
        details: {
          proofId,
          targetUserId: proof.user_id,
          targetEmail: proof.users.email,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
      },
    });

    return NextResponse.json({
      message: `Payment proof ${status}`,
      paymentProof: {
        id: updatedProof.id,
        status: updatedProof.status,
        reviewedAt: updatedProof.reviewed_at,
      },
      userActivated: status === 'approved',
    });
  } catch (error) {
    console.error('Review payment proof error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to review payment proof' },
      { status: 500 }
    );
  }
}
