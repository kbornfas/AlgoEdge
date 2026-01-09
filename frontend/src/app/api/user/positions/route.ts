import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const METAAPI_TOKEN = process.env.METAAPI_TOKEN;
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

/**
 * GET /api/user/positions
 * Get real-time open positions with current prices from MT5
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

    // Get user's connected MT5 account
    const mt5Account = await prisma.mt5Account.findFirst({
      where: {
        userId: decoded.userId,
        status: 'connected',
      },
    });

    if (!mt5Account) {
      return NextResponse.json({
        positions: [],
        message: 'No MT5 account connected',
      });
    }

    // Get the MetaAPI account ID (stored in apiKey field)
    const metaApiAccountId = mt5Account.apiKey;
    if (!metaApiAccountId) {
      return NextResponse.json({
        positions: [],
        message: 'MT5 account not properly configured',
      });
    }

    // Fetch positions from backend (which connects to MetaAPI)
    if (BACKEND_URL) {
      try {
        const backendResponse = await fetch(`${BACKEND_URL}/api/mt5/positions/${metaApiAccountId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (backendResponse.ok) {
          const data = await backendResponse.json();
          return NextResponse.json({
            positions: data.positions || [],
            account: data.account,
          });
        }
      } catch (err) {
        console.error('Backend positions fetch error:', err);
      }
    }

    // Fallback: Get positions from database with last known state
    const trades = await prisma.trade.findMany({
      where: {
        mt5AccountId: mt5Account.id,
        status: 'open',
      },
      include: {
        robot: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { openTime: 'desc' },
    });

    return NextResponse.json({
      positions: trades.map((trade) => ({
        id: trade.id.toString(),
        symbol: trade.pair,
        type: trade.type?.toUpperCase() || 'BUY',
        volume: Number(trade.volume),
        openPrice: Number(trade.openPrice),
        currentPrice: null, // Not available without live connection
        profit: trade.profit ? Number(trade.profit) : 0,
        openTime: trade.openTime,
        robotId: trade.robotId,
        robotName: trade.robot?.name || null,
      })),
      source: 'database',
    });
  } catch (error) {
    console.error('Get positions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}
