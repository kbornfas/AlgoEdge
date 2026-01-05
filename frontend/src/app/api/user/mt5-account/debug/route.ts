import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const META_API_TOKEN = process.env.METAAPI_TOKEN;
const PROVISIONING_API_URL = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';
const CLIENT_API_URL = 'https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * GET /api/user/mt5-account/debug
 * Debug MetaAPI connection and account status
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

    const debug: any = {
      hasMetaApiToken: !!META_API_TOKEN,
      tokenLength: META_API_TOKEN?.length || 0,
      tokenPrefix: META_API_TOKEN?.substring(0, 20) + '...',
    };

    // Get user's MT5 account from database
    const mt5Account = await prisma.mt5Account.findFirst({
      where: {
        userId: decoded.userId,
        status: 'connected',
      },
    });

    debug.dbAccount = mt5Account ? {
      id: mt5Account.id,
      accountId: mt5Account.accountId,
      server: mt5Account.server,
      apiKey: mt5Account.apiKey ? mt5Account.apiKey.substring(0, 10) + '...' : null,
      balance: mt5Account.balance,
      equity: mt5Account.equity,
      status: mt5Account.status,
    } : null;

    if (!META_API_TOKEN) {
      debug.error = 'METAAPI_TOKEN not configured in environment';
      return NextResponse.json(debug);
    }

    // List all MetaAPI accounts
    try {
      const listResponse = await fetch(`${PROVISIONING_API_URL}/users/current/accounts`, {
        headers: {
          'auth-token': META_API_TOKEN,
        },
      });

      debug.listAccountsStatus = listResponse.status;

      if (listResponse.ok) {
        const accounts = await listResponse.json();
        debug.metaApiAccounts = accounts.map((acc: any) => ({
          id: acc._id,
          login: acc.login,
          server: acc.server,
          state: acc.state,
          connectionStatus: acc.connectionStatus,
          type: acc.type,
        }));

        // Find matching account
        if (mt5Account) {
          const matchingAccount = accounts.find((acc: any) => 
            String(acc.login) === String(mt5Account.accountId) && acc.server === mt5Account.server
          );
          debug.matchingMetaApiAccount = matchingAccount ? {
            id: matchingAccount._id,
            login: matchingAccount.login,
            server: matchingAccount.server,
            state: matchingAccount.state,
            connectionStatus: matchingAccount.connectionStatus,
          } : 'NOT FOUND';

          // If we have a matching account, try to get account info
          if (matchingAccount && matchingAccount.state === 'DEPLOYED') {
            try {
              const infoResponse = await fetch(
                `${CLIENT_API_URL}/users/current/accounts/${matchingAccount._id}/account-information`,
                {
                  headers: {
                    'auth-token': META_API_TOKEN,
                  },
                }
              );

              debug.accountInfoStatus = infoResponse.status;

              if (infoResponse.ok) {
                const info = await infoResponse.json();
                debug.accountInfo = {
                  balance: info.balance,
                  equity: info.equity,
                  margin: info.margin,
                  freeMargin: info.freeMargin,
                  currency: info.currency,
                  leverage: info.leverage,
                };
              } else {
                const errorText = await infoResponse.text();
                debug.accountInfoError = errorText;
              }
            } catch (infoError) {
              debug.accountInfoError = String(infoError);
            }
          }
        }
      } else {
        const errorText = await listResponse.text();
        debug.listAccountsError = errorText;
      }
    } catch (apiError) {
      debug.apiError = String(apiError);
    }

    return NextResponse.json(debug);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
