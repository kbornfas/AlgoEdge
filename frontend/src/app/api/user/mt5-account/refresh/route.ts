import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

/**
 * POST /api/user/mt5-account/refresh
 * Refresh MT5 account balance/equity via backend (which uses MetaAPI SDK)
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

    const mt5Account = await prisma.mt5Account.findFirst({
      where: { userId: decoded.userId, status: 'connected' },
    });

    if (!mt5Account) {
      return NextResponse.json({ error: 'No connected MT5 account' }, { status: 404 });
    }

    if (!mt5Account.apiKey) {
      return NextResponse.json({ error: 'Account not provisioned in MetaAPI' }, { status: 400 });
    }

    // Call backend to get real-time balance/equity via MetaAPI SDK
    let balance = Number(mt5Account.balance) || 0;
    let equity = Number(mt5Account.equity) || 0;

    if (BACKEND_URL) {
      try {
        console.log('Fetching account info from backend:', `${BACKEND_URL}/api/mt5/account-info/${mt5Account.apiKey}`);
        
        const backendResponse = await fetch(
          `${BACKEND_URL}/api/mt5/account-info/${mt5Account.apiKey}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (backendResponse.ok) {
          const data = await backendResponse.json();
          balance = data.balance || balance;
          equity = data.equity || equity;
          console.log('Got live balance from backend:', { balance, equity });
        } else {
          const errorText = await backendResponse.text();
          console.error('Backend account-info failed:', backendResponse.status, errorText);
        }
      } catch (backendErr) {
        console.error('Error calling backend for account info:', backendErr);
      }
    } else {
      console.warn('BACKEND_URL not configured, using stored values');
    }

    // Update database with latest values
    const updated = await prisma.mt5Account.update({
      where: { id: mt5Account.id },
      data: {
        balance: balance,
        equity: equity,
        lastSync: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Account refreshed',
      account: {
        id: updated.id,
        accountId: updated.accountId,
        server: updated.server,
        status: updated.status,
        balance: Number(updated.balance),
        equity: Number(updated.equity),
        lastSync: updated.lastSync,
      },
    });
  } catch (error: any) {
    console.error('Refresh error:', error);
    return NextResponse.json({ error: error.message || 'Refresh failed' }, { status: 500 });
  }
}
