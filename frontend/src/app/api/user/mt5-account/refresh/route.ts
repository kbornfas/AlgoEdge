import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const META_API_TOKEN = process.env.METAAPI_TOKEN;
const CLIENT_API_URL = 'https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * Get account information from MetaAPI
 */
async function getAccountInfo(metaApiAccountId: string): Promise<{
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
} | null> {
  if (!META_API_TOKEN) return null;

  try {
    const response = await fetch(
      `${CLIENT_API_URL}/users/current/accounts/${metaApiAccountId}/account-information`,
      {
        headers: {
          'auth-token': META_API_TOKEN,
        },
      }
    );

    if (!response.ok) {
      console.error('MetaAPI account info response:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return {
      balance: data.balance || 0,
      equity: data.equity || 0,
      margin: data.margin || 0,
      freeMargin: data.freeMargin || 0,
    };
  } catch (error) {
    console.error('Error fetching account info:', error);
    return null;
  }
}

/**
 * POST /api/user/mt5-account/refresh
 * Refresh MT5 account balance from MetaAPI
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
        { error: 'No connected MT5 account found' },
        { status: 404 }
      );
    }

    // Get MetaAPI account ID (stored in apiKey field)
    const metaApiAccountId = mt5Account.apiKey;

    if (!metaApiAccountId) {
      return NextResponse.json(
        { error: 'Account not properly provisioned with MetaAPI' },
        { status: 400 }
      );
    }

    // Fetch real balance from MetaAPI
    const accountInfo = await getAccountInfo(metaApiAccountId);

    if (!accountInfo) {
      return NextResponse.json(
        { error: 'Failed to fetch account information from MetaAPI' },
        { status: 500 }
      );
    }

    // Update database with fresh data
    const updatedAccount = await prisma.mt5Account.update({
      where: { id: mt5Account.id },
      data: {
        balance: accountInfo.balance,
        equity: accountInfo.equity,
        lastSync: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Account refreshed successfully',
      account: {
        id: updatedAccount.id,
        accountId: updatedAccount.accountId,
        server: updatedAccount.server,
        status: updatedAccount.status,
        balance: updatedAccount.balance,
        equity: updatedAccount.equity,
        lastSync: updatedAccount.lastSync,
      },
    });
  } catch (error) {
    console.error('Refresh MT5 account error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh MT5 account' },
      { status: 500 }
    );
  }
}
