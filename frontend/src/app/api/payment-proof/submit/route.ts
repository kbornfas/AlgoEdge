import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const submitProofSchema = z.object({
  proofUrl: z.string().url(),
  amount: z.number().positive().optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/payment-proof/submit
 * Submit payment proof for admin review
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { proofUrl, amount, notes } = submitProofSchema.parse(body);

    // Create payment proof record
    const paymentProof = await prisma.payment_proofs.create({
      data: {
        user_id: decoded.userId,
        proof_url: proofUrl,
        amount,
        notes,
        status: 'pending',
      },
    });

    // Update user's payment status
    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        paymentProofUrl: proofUrl,
        paymentStatus: 'submitted',
        paymentSubmittedAt: new Date(),
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'PAYMENT_PROOF_SUBMITTED',
        details: {
          proofId: paymentProof.id,
          amount,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
      },
    });

    return NextResponse.json({
      message: 'Payment proof submitted successfully. Awaiting admin approval.',
      paymentProof: {
        id: paymentProof.id,
        status: paymentProof.status,
        submittedAt: paymentProof.submitted_at,
      },
    });
  } catch (error) {
    console.error('Submit payment proof error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit payment proof' },
      { status: 500 }
    );
  }
}
