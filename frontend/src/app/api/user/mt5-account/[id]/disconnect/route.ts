import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/mt5-account/[id]/disconnect
 * Disconnect an MT5 account
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token) as any;

    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const accountId = parseInt(params.id);

    // Verify the account belongs to the user
    const mt5Account = await prisma.mt5Account.findFirst({
      where: {
        id: accountId,
        userId: decoded.userId,
      },
    });

    if (!mt5Account) {
      return NextResponse.json(
        { error: 'MT5 account not found' },
        { status: 404 }
      );
    }

    // Update account status to disconnected
    await prisma.mt5Account.update({
      where: { id: accountId },
      data: {
        status: 'disconnected',
      },
    });

    // Log the disconnection
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'MT5_ACCOUNT_DISCONNECTED',
        details: {
          accountId: mt5Account.accountId,
          server: mt5Account.server,
        },
        ipAddress: req.headers.get('x-forwarded-for') || '',
      },
    });

    return NextResponse.json({
      message: 'MT5 account disconnected successfully',
    });
  } catch (error) {
    console.error('Disconnect MT5 account error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect MT5 account' },
      { status: 500 }
    );
  }
}
