import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import axios from 'axios';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PROVISIONING_API_URL = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';
const CLIENT_API_URL = 'https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * GET /api/user/mt5-account/debug
 * Debug MetaAPI connection and update balance
 */
export async function GET(req: NextRequest) {
  const debug: any = { timestamp: new Date().toISOString() };
  
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

    // Read token at runtime, not module load
    const META_API_TOKEN = process.env.METAAPI_TOKEN;
    
    debug.step1_tokenCheck = {
      hasMetaApiToken: !!META_API_TOKEN,
      tokenLength: META_API_TOKEN?.length || 0,
    };

    if (!META_API_TOKEN) {
      debug.error = 'METAAPI_TOKEN not found. Add it to Vercel Environment Variables!';
      return NextResponse.json(debug);
    }

    const headers = { 'auth-token': META_API_TOKEN };
    const config = { headers, timeout: 30000 };

    // Get user's MT5 account from database
    const mt5Account = await prisma.mt5Account.findFirst({
      where: { userId: decoded.userId, status: 'connected' },
    });

    debug.step2_dbAccount = mt5Account ? {
      id: mt5Account.id,
      accountId: mt5Account.accountId,
      server: mt5Account.server,
      storedMetaApiId: mt5Account.apiKey || 'NOT SET',
      currentBalance: Number(mt5Account.balance),
    } : 'NO ACCOUNT';

    if (!mt5Account) {
      return NextResponse.json(debug);
    }

    // List all MetaAPI accounts
    let accounts: any[] = [];
    try {
      const listResponse = await axios.get(
        `${PROVISIONING_API_URL}/users/current/accounts`,
        config
      );
      accounts = listResponse.data;
      debug.step3_metaApiList = { 
        status: listResponse.status, 
        totalAccounts: accounts.length,
        accounts: accounts.map((a: any) => ({
          id: a._id,
          login: a.login,
          server: a.server,
          state: a.state,
          connectionStatus: a.connectionStatus,
        })),
      };
    } catch (err: any) {
      debug.step3_metaApiList = { 
        error: err.message,
        response: err.response?.data,
        status: err.response?.status,
      };
      return NextResponse.json(debug);
    }

    // Find matching account
    const matchingAccount = accounts.find((acc: any) => 
      String(acc.login) === String(mt5Account.accountId) && acc.server === mt5Account.server
    );

    debug.step4_matchingAccount = matchingAccount ? {
      id: matchingAccount._id,
      login: matchingAccount.login,
      server: matchingAccount.server,
      state: matchingAccount.state,
      connectionStatus: matchingAccount.connectionStatus,
    } : `NOT FOUND for login=${mt5Account.accountId} server=${mt5Account.server}`;

    if (!matchingAccount) {
      debug.action = 'Disconnect and reconnect with your MT5 password';
      return NextResponse.json(debug);
    }

    // Save MetaAPI ID
    if (!mt5Account.apiKey) {
      await prisma.mt5Account.update({
        where: { id: mt5Account.id },
        data: { apiKey: matchingAccount._id },
      });
    }

    // Check deployment status
    if (matchingAccount.state !== 'DEPLOYED') {
      try {
        await axios.post(
          `${PROVISIONING_API_URL}/users/current/accounts/${matchingAccount._id}/deploy`,
          {},
          config
        );
        debug.step5 = 'Deploy request sent. Wait 30s and try again.';
      } catch (e: any) {
        debug.step5 = 'Deploy failed: ' + e.message;
      }
      return NextResponse.json(debug);
    }

    if (matchingAccount.connectionStatus !== 'CONNECTED') {
      debug.step5 = `Status: ${matchingAccount.connectionStatus}. Reconnect with correct password.`;
      return NextResponse.json(debug);
    }

    // Get account info
    try {
      const infoResponse = await axios.get(
        `${CLIENT_API_URL}/users/current/accounts/${matchingAccount._id}/account-information`,
        config
      );

      const info = infoResponse.data;
      debug.step6_accountInfo = {
        balance: info.balance,
        equity: info.equity,
        currency: info.currency,
        name: info.name,
      };

      // UPDATE DATABASE
      if (info.balance !== undefined) {
        const updated = await prisma.mt5Account.update({
          where: { id: mt5Account.id },
          data: {
            balance: info.balance,
            equity: info.equity || info.balance,
            apiKey: matchingAccount._id,
            lastSync: new Date(),
          },
        });
        
        debug.step7_updated = {
          newBalance: Number(updated.balance),
          newEquity: Number(updated.equity),
        };
        debug.SUCCESS = `Balance updated to $${info.balance}! Refresh the page.`;
      }
    } catch (err: any) {
      debug.step6_error = {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      };
    }

    return NextResponse.json(debug);
  } catch (error: any) {
    debug.error = error.message;
    return NextResponse.json(debug, { status: 500 });
  }
}
