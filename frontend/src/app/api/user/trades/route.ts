import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/trades
 * Get user's trade history from connected MT5 account
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

    // Get query params
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check if user has a connected MT5 account
    const mt5Account = await prisma.mt5Account.findFirst({
      where: {
        userId: decoded.userId,
        status: 'connected',
      },
    });

    if (!mt5Account) {
      return NextResponse.json({
        trades: [],
        totalCount: 0,
        totalProfit: 0,
        message: 'No MT5 account connected',
      });
    }

    // Get trades from database
    const [trades, totalCount] = await Promise.all([
      prisma.trade.findMany({
        where: { mt5AccountId: mt5Account.id },
        orderBy: { openTime: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.trade.count({
        where: { mt5AccountId: mt5Account.id },
      }),
    ]);

    // Calculate total profit
    const profitResult = await prisma.trade.aggregate({
      where: { mt5AccountId: mt5Account.id },
      _sum: { profit: true },
    });

    return NextResponse.json({
      trades: trades.map((trade) => ({
        id: Number(trade.id),
        symbol: trade.pair,
        type: trade.type,
        volume: Number(trade.volume),
        openPrice: Number(trade.openPrice),
        closePrice: trade.closePrice ? Number(trade.closePrice) : null,
        profit: trade.profit ? Number(trade.profit) : 0,
        openTime: trade.openTime,
        closeTime: trade.closeTime,
        status: trade.status,
      })),
      totalCount,
      totalProfit: Number(profitResult._sum.profit) || 0,
    });
  } catch (error) {
    console.error('Get trades error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}
