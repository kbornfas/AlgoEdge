import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const META_API_TOKEN = process.env.METAAPI_TOKEN;
const PROVISIONING_API_URL = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';
const CLIENT_API_URL = 'https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * Find existing MetaAPI account by login/server
 */
async function findMetaApiAccount(login: string, server: string): Promise<string | null> {
  if (!META_API_TOKEN) return null;

  try {
    const response = await fetch(`${PROVISIONING_API_URL}/users/current/accounts`, {
      headers: {
        'auth-token': META_API_TOKEN,
      },
    });

    if (!response.ok) return null;

    const accounts = await response.json();
    const account = accounts.find((acc: any) => acc.login === login && acc.server === server);
    
    if (account) {
      // Make sure it's deployed
      if (account.state !== 'DEPLOYED') {
        await fetch(`${PROVISIONING_API_URL}/users/current/accounts/${account._id}/deploy`, {
          method: 'POST',
          headers: { 'auth-token': META_API_TOKEN },
        });
        // Wait a bit for deployment
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      return account._id;
    }
    return null;
  } catch (error) {
    console.error('Error finding MetaAPI account:', error);
    return null;
  }
}

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
    let metaApiAccountId = mt5Account.apiKey;

    // If no MetaAPI account ID, try to find existing one
    if (!metaApiAccountId) {
      console.log('No MetaAPI account ID found, searching for existing account...');
      metaApiAccountId = await findMetaApiAccount(mt5Account.accountId, mt5Account.server);
      
      if (metaApiAccountId) {
        // Store it for future use
        await prisma.mt5Account.update({
          where: { id: mt5Account.id },
          data: { apiKey: metaApiAccountId },
        });
        console.log('Found and stored MetaAPI account ID:', metaApiAccountId);
      } else {
        return NextResponse.json(
          { error: 'Account not provisioned with MetaAPI. Please disconnect and reconnect your account.' },
          { status: 400 }
        );
      }
    }

    // Fetch real balance from MetaAPI
    const accountInfo = await getAccountInfo(metaApiAccountId);

    if (!accountInfo) {
      return NextResponse.json(
        { error: 'Failed to fetch account information from MetaAPI. The account may still be deploying.' },
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
