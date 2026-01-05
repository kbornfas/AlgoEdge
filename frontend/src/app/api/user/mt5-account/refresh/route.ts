import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import axios from 'axios';
import https from 'https';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PROVISIONING_API_URL = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';
const CLIENT_API_URL = 'https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai';

// Create https agent that handles SSL certificates properly
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

/**
 * Find and get MetaAPI account info
 */
async function getMetaApiAccountInfo(login: string, server: string): Promise<{
  metaApiId: string | null;
  balance: number;
  equity: number;
  error?: string;
}> {
  const META_API_TOKEN = process.env.METAAPI_TOKEN;
  
  if (!META_API_TOKEN) {
    return { metaApiId: null, balance: 0, equity: 0, error: 'No MetaAPI token' };
  }

  const headers = { 'auth-token': META_API_TOKEN };
  const config = { headers, timeout: 30000, httpsAgent };

  try {
    // List accounts
    const listResponse = await axios.get(
      `${PROVISIONING_API_URL}/users/current/accounts`,
      config
    );

    const accounts = listResponse.data;
    const account = accounts.find((acc: any) => 
      String(acc.login) === String(login) && acc.server === server
    );

    if (!account) {
      return { metaApiId: null, balance: 0, equity: 0, error: 'Account not found in MetaAPI' };
    }

    if (account.state !== 'DEPLOYED' || account.connectionStatus !== 'CONNECTED') {
      return { 
        metaApiId: account._id, 
        balance: 0, 
        equity: 0, 
        error: `Account status: ${account.state}/${account.connectionStatus}` 
      };
    }

    // Get account info
    const infoResponse = await axios.get(
      `${CLIENT_API_URL}/users/current/accounts/${account._id}/account-information`,
      config
    );

    const info = infoResponse.data;
    return {
      metaApiId: account._id,
      balance: info.balance || 0,
      equity: info.equity || info.balance || 0,
    };
  } catch (err: any) {
    return { metaApiId: null, balance: 0, equity: 0, error: err.message };
  }
}

/**
 * POST /api/user/mt5-account/refresh
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

    // Get real balance from MetaAPI
    const result = await getMetaApiAccountInfo(mt5Account.accountId, mt5Account.server);

    if (result.error && result.balance === 0) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Update database
    const updated = await prisma.mt5Account.update({
      where: { id: mt5Account.id },
      data: {
        balance: result.balance,
        equity: result.equity,
        apiKey: result.metaApiId || mt5Account.apiKey,
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
