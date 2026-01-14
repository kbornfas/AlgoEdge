import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Mark as dynamic route since it uses authentication headers
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/payment-proofs
 * Get all payment proofs for admin review
 */
export async function GET(req: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // pending, approved, rejected

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Get payment proofs with pagination
    const [paymentProofs, total] = await Promise.all([
      prisma.paymentProof.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              fullName: true,
              phone: true,
            },
          },
        },
      }),
      prisma.paymentProof.count({ where }),
    ]);

    return NextResponse.json({
      paymentProofs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get payment proofs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment proofs' },
      { status: 500 }
    );
  }
}
