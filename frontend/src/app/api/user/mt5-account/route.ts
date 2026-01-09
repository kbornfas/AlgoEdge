import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

/**
 * GET /api/user/mt5-account
 * Get user's connected MT5 account with REAL-TIME balance from MetaAPI
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

    // Fetch REAL-TIME balance from backend (MetaAPI)
    let balance = Number(mt5Account.balance) || 0;
    let equity = Number(mt5Account.equity) || 0;

    if (mt5Account.apiKey && BACKEND_URL) {
      try {
        // Use AbortController for timeout (5 seconds to avoid Vercel 10s limit)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const backendResponse = await fetch(
          `${BACKEND_URL}/api/mt5/account-info/${mt5Account.apiKey}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          }
        );
        
        clearTimeout(timeoutId);

        if (backendResponse.ok) {
          const liveData = await backendResponse.json();
          balance = liveData.balance || balance;
          equity = liveData.equity || equity;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Backend request timed out, using cached balance');
        } else {
          console.error('Failed to fetch live balance:', err);
        }
      }
    }

    return NextResponse.json({
      account: {
        id: mt5Account.id,
        accountId: mt5Account.accountId,
        server: mt5Account.server,
        status: mt5Account.status,
        balance: balance,
        equity: equity,
        connectedAt: mt5Account.updatedAt,
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
