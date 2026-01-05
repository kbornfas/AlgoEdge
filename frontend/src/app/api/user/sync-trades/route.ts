import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { syncTrades, getAccountInfo } from '@/lib/services/metaApiTrading';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/sync-trades
 * Sync trades from MetaAPI and update account balance
 */
export async function POST(req: NextRequest) {
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

    // Get user's connected MT5 account
    const mt5Account = await prisma.mt5Account.findFirst({
      where: {
        userId: decoded.userId,
        status: 'connected',
      },
    });

    if (!mt5Account) {
      return NextResponse.json(
        { error: 'No MT5 account connected' },
        { status: 400 }
      );
    }

    // Sync trades from MetaAPI
    const syncResult = await syncTrades(
      decoded.userId,
      mt5Account.id,
      mt5Account.accountId
    );

    // Get updated account info
    const accountInfo = await getAccountInfo(mt5Account.accountId);

    return NextResponse.json({
      message: 'Sync completed',
      synced: syncResult.synced,
      updated: syncResult.updated,
      account: accountInfo ? {
        balance: accountInfo.balance,
        equity: accountInfo.equity,
        margin: accountInfo.margin,
        freeMargin: accountInfo.freeMargin,
      } : null,
    });
  } catch (error) {
    console.error('Sync trades error:', error);
    return NextResponse.json(
      { error: 'Failed to sync trades' },
      { status: 500 }
    );
  }
}
