import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const META_API_TOKEN = process.env.METAAPI_TOKEN;
const PROVISIONING_API_URL = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';
const CLIENT_API_URL = 'https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * Find existing MetaAPI account by login/server and ensure it's deployed
 */
async function findAndDeployMetaApiAccount(login: string, server: string): Promise<{
  accountId: string | null;
  state: string;
  connectionStatus: string;
  error?: string;
}> {
  if (!META_API_TOKEN) {
    return { accountId: null, state: 'ERROR', connectionStatus: 'ERROR', error: 'MetaAPI token not configured' };
  }

  try {
    const response = await fetch(`${PROVISIONING_API_URL}/users/current/accounts`, {
      headers: {
        'auth-token': META_API_TOKEN,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Failed to list accounts:', response.status, text);
      return { accountId: null, state: 'ERROR', connectionStatus: 'ERROR', error: `API error: ${response.status}` };
    }

    const accounts = await response.json();
    console.log('Found MetaAPI accounts:', accounts.length);
    
    const account = accounts.find((acc: any) => acc.login === login && acc.server === server);
    
    if (!account) {
      console.log('No matching account found for login:', login, 'server:', server);
      return { accountId: null, state: 'NOT_FOUND', connectionStatus: 'NOT_FOUND', error: 'Account not found in MetaAPI' };
    }

    console.log('Found account:', account._id, 'state:', account.state, 'connectionStatus:', account.connectionStatus);

    // Deploy if not deployed
    if (account.state !== 'DEPLOYED') {
      console.log('Deploying account...');
      await fetch(`${PROVISIONING_API_URL}/users/current/accounts/${account._id}/deploy`, {
        method: 'POST',
        headers: { 'auth-token': META_API_TOKEN },
      });
      
      // Wait and check status
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await fetch(`${PROVISIONING_API_URL}/users/current/accounts/${account._id}`, {
          headers: { 'auth-token': META_API_TOKEN },
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log('Account status:', statusData.state, statusData.connectionStatus);
          
          if (statusData.state === 'DEPLOYED' && statusData.connectionStatus === 'CONNECTED') {
            return { accountId: account._id, state: statusData.state, connectionStatus: statusData.connectionStatus };
          }
        }
      }
    }

    return { accountId: account._id, state: account.state, connectionStatus: account.connectionStatus };
  } catch (error) {
    console.error('Error finding MetaAPI account:', error);
    return { accountId: null, state: 'ERROR', connectionStatus: 'ERROR', error: String(error) };
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
  error?: string;
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
      const text = await response.text();
      console.error('MetaAPI account info error:', response.status, text);
      return { balance: 0, equity: 0, margin: 0, freeMargin: 0, error: `API returned ${response.status}: ${text}` };
    }

    const data = await response.json();
    console.log('Account info received:', data);
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
    let accountState = '';
    let connectionStatus = '';

    // If no MetaAPI account ID, try to find existing one
    if (!metaApiAccountId) {
      console.log('No MetaAPI account ID found, searching for existing account...');
      const result = await findAndDeployMetaApiAccount(mt5Account.accountId, mt5Account.server);
      
      if (result.accountId) {
        metaApiAccountId = result.accountId;
        accountState = result.state;
        connectionStatus = result.connectionStatus;
        
        // Store it for future use
        await prisma.mt5Account.update({
          where: { id: mt5Account.id },
          data: { apiKey: metaApiAccountId },
        });
        console.log('Found and stored MetaAPI account ID:', metaApiAccountId);
      } else {
        return NextResponse.json(
          { error: result.error || 'Account not found in MetaAPI. Please disconnect and reconnect your account with your MT5 password.' },
          { status: 400 }
        );
      }
    }

    // Check account state before fetching info
    if (connectionStatus && connectionStatus !== 'CONNECTED') {
      return NextResponse.json(
        { error: `Account is ${accountState}/${connectionStatus}. Please wait for it to connect or try reconnecting.` },
        { status: 400 }
      );
    }

    // Fetch real balance from MetaAPI
    const accountInfo = await getAccountInfo(metaApiAccountId);

    if (!accountInfo) {
      return NextResponse.json(
        { error: 'Failed to fetch account information from MetaAPI. The account may still be deploying.' },
        { status: 500 }
      );
    }

    if (accountInfo.error) {
      return NextResponse.json(
        { error: `MetaAPI error: ${accountInfo.error}` },
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
