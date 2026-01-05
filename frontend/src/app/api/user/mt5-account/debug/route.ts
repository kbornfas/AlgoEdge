import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds

const META_API_TOKEN = process.env.METAAPI_TOKEN;
const PROVISIONING_API_URL = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';
const CLIENT_API_URL = 'https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * GET /api/user/mt5-account/debug
 * Debug MetaAPI connection and account status - also updates balance if found
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

    debug.step1_tokenCheck = {
      hasMetaApiToken: !!META_API_TOKEN,
      tokenLength: META_API_TOKEN?.length || 0,
    };

    if (!META_API_TOKEN) {
      debug.error = 'CRITICAL: METAAPI_TOKEN not found in environment. Add it to Vercel Environment Variables!';
      return NextResponse.json(debug);
    }

    // Get user's MT5 account from database
    const mt5Account = await prisma.mt5Account.findFirst({
      where: {
        userId: decoded.userId,
        status: 'connected',
      },
    });

    debug.step2_dbAccount = mt5Account ? {
      id: mt5Account.id,
      accountId: mt5Account.accountId,
      server: mt5Account.server,
      storedMetaApiId: mt5Account.apiKey || 'NOT SET',
      currentBalance: Number(mt5Account.balance),
      currentEquity: Number(mt5Account.equity),
    } : 'NO ACCOUNT IN DATABASE';

    if (!mt5Account) {
      return NextResponse.json(debug);
    }

    // List all MetaAPI accounts
    let accounts: any[] = [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const listResponse = await fetch(`${PROVISIONING_API_URL}/users/current/accounts`, {
        headers: { 'auth-token': META_API_TOKEN },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      debug.step3_metaApiList = { status: listResponse.status };

      if (!listResponse.ok) {
        const errorText = await listResponse.text();
        debug.step3_metaApiList.error = errorText;
        return NextResponse.json(debug);
      }

      accounts = await listResponse.json();
      debug.step3_metaApiList.totalAccounts = accounts.length;
      debug.step3_metaApiList.allAccounts = accounts.map((acc: any) => ({
        id: acc._id,
        login: acc.login,
        server: acc.server,
        state: acc.state,
        connectionStatus: acc.connectionStatus,
      }));
    } catch (fetchError: any) {
      debug.step3_metaApiList = { 
        error: fetchError.message || 'Fetch failed',
        name: fetchError.name,
        cause: fetchError.cause?.message || 'Unknown'
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
    } : `NOT FOUND - Looking for login=${mt5Account.accountId} server=${mt5Account.server}`;

    if (!matchingAccount) {
      debug.suggestion = 'Account not in MetaAPI. Need to disconnect and reconnect with password.';
      return NextResponse.json(debug);
    }

    // Store the MetaAPI ID if not stored
    if (!mt5Account.apiKey) {
      await prisma.mt5Account.update({
        where: { id: mt5Account.id },
        data: { apiKey: matchingAccount._id },
      });
      debug.step4_storedMetaApiId = matchingAccount._id;
    }

    // Check if account is deployed and connected
    if (matchingAccount.state !== 'DEPLOYED') {
      debug.step5_deployment = `Account state is ${matchingAccount.state}, not DEPLOYED`;
      
      // Try to deploy
      try {
        await fetch(`${PROVISIONING_API_URL}/users/current/accounts/${matchingAccount._id}/deploy`, {
          method: 'POST',
          headers: { 'auth-token': META_API_TOKEN },
        });
        debug.step5_deployment = 'Sent deploy request. Wait 30 seconds and try again.';
      } catch (e) {
        debug.step5_deployment = 'Failed to deploy: ' + (e as any).message;
      }
      return NextResponse.json(debug);
    }

    if (matchingAccount.connectionStatus !== 'CONNECTED') {
      debug.step5_connection = `Connection status is ${matchingAccount.connectionStatus}, not CONNECTED`;
      debug.suggestion = 'Account credentials may be wrong. Disconnect and reconnect with correct password.';
      return NextResponse.json(debug);
    }

    // Get account info
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const infoResponse = await fetch(
        `${CLIENT_API_URL}/users/current/accounts/${matchingAccount._id}/account-information`,
        { 
          headers: { 'auth-token': META_API_TOKEN },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      debug.step6_accountInfo = { status: infoResponse.status };

      if (!infoResponse.ok) {
        const errorText = await infoResponse.text();
        debug.step6_accountInfo.error = errorText;
        return NextResponse.json(debug);
      }

      const info = await infoResponse.json();
      debug.step6_accountInfo.data = {
        balance: info.balance,
        equity: info.equity,
        currency: info.currency,
        leverage: info.leverage,
        name: info.name,
        server: info.server,
      };

      // UPDATE THE DATABASE with real balance!
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
          success: true,
          newBalance: Number(updated.balance),
          newEquity: Number(updated.equity),
        };
      }

      debug.SUCCESS = 'Balance fetched and updated! Refresh the page to see new balance.';
    } catch (infoError: any) {
      debug.step6_accountInfo = {
        error: infoError.message || 'Fetch failed',
        name: infoError.name,
      };
    }

    return NextResponse.json(debug);
  } catch (error: any) {
    debug.error = error.message || String(error);
    debug.stack = error.stack;
    return NextResponse.json(debug, { status: 500 });
  }
}
