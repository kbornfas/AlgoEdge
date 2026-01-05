import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/mt5-account
 * Get user's connected MT5 account with real-time balance
 */
export async function GET(req: NextRequest) {
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

    // Get user's MT5 account
    const mt5Account = await prisma.mt5Account.findFirst({
      where: {
        userId: decoded.userId,
        status: 'connected',
      },
    });

    if (!mt5Account) {
      return NextResponse.json({ account: null });
    }

    // TODO: Fetch real-time balance from MetaAPI
    // For now, return the stored account info
    // In production, you would call MetaAPI here to get live balance/equity

    return NextResponse.json({
      account: {
        id: mt5Account.id,
        accountId: mt5Account.accountId,
        server: mt5Account.server,
        status: mt5Account.status,
        balance: mt5Account.balance,
        equity: mt5Account.equity,
        connectedAt: mt5Account.connectedAt,
      },
    });
  } catch (error) {
    console.error('Get MT5 account error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MT5 account' },
      { status: 500 }
    );
  }
}
