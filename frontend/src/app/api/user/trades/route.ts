import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

/**
 * GET /api/user/trades
 * Get user's trade history - combines live data from MetaAPI with database records
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
    const status = searchParams.get('status'); // 'OPEN', 'CLOSED', or null for all

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

    // Try to get real trade history from backend (MetaAPI)
    let liveHistoryTrades: any[] = [];
    
    if (mt5Account.apiKey && BACKEND_URL && status !== 'OPEN') {
      try {
        console.log('Fetching trade history from backend...');
        const historyResponse = await fetch(
          `${BACKEND_URL}/api/mt5/history/${mt5Account.apiKey}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          liveHistoryTrades = historyData.trades || [];
          console.log('Got', liveHistoryTrades.length, 'trades from MetaAPI history');
        }
      } catch (err) {
        console.error('Error fetching live history:', err);
      }
    }

    // If we have live history, use it
    if (liveHistoryTrades.length > 0) {
      // Group deals by positionId to calculate real profit per trade
      const positionMap = new Map<string, any>();
      
      for (const deal of liveHistoryTrades) {
        const posId = deal.positionId || deal.id;
        if (!positionMap.has(posId)) {
          positionMap.set(posId, {
            id: posId,
            symbol: deal.symbol,
            type: deal.type,
            volume: deal.volume,
            openPrice: deal.entryType === 'DEAL_ENTRY_IN' ? deal.price : null,
            closePrice: deal.entryType === 'DEAL_ENTRY_OUT' ? deal.price : null,
            profit: 0,
            commission: 0,
            swap: 0,
            openTime: deal.time,
            closeTime: null,
            status: 'CLOSED',
          });
        }
        
        const pos = positionMap.get(posId);
        pos.profit += deal.profit || 0;
        pos.commission += deal.commission || 0;
        pos.swap += deal.swap || 0;
        
        if (deal.entryType === 'DEAL_ENTRY_IN') {
          pos.openPrice = deal.price;
          pos.openTime = deal.time;
          pos.type = deal.type;
          pos.volume = deal.volume;
        } else if (deal.entryType === 'DEAL_ENTRY_OUT') {
          pos.closePrice = deal.price;
          pos.closeTime = deal.time;
        }
      }

      const trades = Array.from(positionMap.values())
        .filter(t => t.closePrice !== null) // Only closed trades
        .sort((a, b) => new Date(b.closeTime || b.openTime).getTime() - new Date(a.closeTime || a.openTime).getTime());

      const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);

      return NextResponse.json({
        trades: trades.map(t => ({
          ...t,
          pair: t.symbol,
        })),
        totalCount: trades.length,
        totalProfit,
      });
    }

    // Fallback: Get trades from database
    const whereClause: any = { mt5AccountId: mt5Account.id };
    if (status) {
      whereClause.status = status.toLowerCase();
    }

    const [trades, totalCount] = await Promise.all([
      prisma.trade.findMany({
        where: whereClause,
        orderBy: { openTime: 'desc' },
        take: 50,
        include: {
          robot: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.trade.count({
        where: whereClause,
      }),
    ]);

    const profitResult = await prisma.trade.aggregate({
      where: whereClause,
      _sum: { profit: true },
    });

    return NextResponse.json({
      trades: trades.map((trade) => ({
        id: trade.id.toString(),
        pair: trade.pair,
        symbol: trade.pair,
        type: trade.type?.toUpperCase() || 'BUY',
        volume: Number(trade.volume),
        openPrice: Number(trade.openPrice),
        closePrice: trade.closePrice ? Number(trade.closePrice) : null,
        stopLoss: trade.stopLoss ? Number(trade.stopLoss) : null,
        takeProfit: trade.takeProfit ? Number(trade.takeProfit) : null,
        profit: trade.profit ? Number(trade.profit) : 0,
        openTime: trade.openTime,
        closeTime: trade.closeTime,
        status: trade.status?.toUpperCase() || 'OPEN',
        robotId: trade.robotId,
        robotName: trade.robot?.name || null,
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
