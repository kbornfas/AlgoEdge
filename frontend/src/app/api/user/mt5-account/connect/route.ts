import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const META_API_TOKEN = process.env.METAAPI_TOKEN;
const PROVISIONING_API_URL = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';
const CLIENT_API_URL = 'https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai';

const connectSchema = z.object({
  accountId: z.string().min(1),
  password: z.string().min(1),
  server: z.string().min(1),
});

/**
 * Create or find MetaAPI account for the MT5 credentials
 */
async function provisionMetaApiAccount(accountId: string, password: string, server: string): Promise<{
  success: boolean;
  metaApiAccountId?: string;
  error?: string;
}> {
  if (!META_API_TOKEN) {
    return { success: false, error: 'MetaAPI token not configured' };
  }

  try {
    // First, check if account already exists in MetaAPI
    const listResponse = await fetch(`${PROVISIONING_API_URL}/users/current/accounts`, {
      headers: {
        'auth-token': META_API_TOKEN,
      },
    });

    if (listResponse.ok) {
      const accounts = await listResponse.json();
      const existingAccount = accounts.find((acc: any) => acc.login === accountId && acc.server === server);
      
      if (existingAccount) {
        // Account exists, deploy it if needed
        if (existingAccount.state !== 'DEPLOYED') {
          await fetch(`${PROVISIONING_API_URL}/users/current/accounts/${existingAccount._id}/deploy`, {
            method: 'POST',
            headers: {
              'auth-token': META_API_TOKEN,
            },
          });
        }
        return { success: true, metaApiAccountId: existingAccount._id };
      }
    }

    // Create new account in MetaAPI
    const createResponse = await fetch(`${PROVISIONING_API_URL}/users/current/accounts`, {
      method: 'POST',
      headers: {
        'auth-token': META_API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `AlgoEdge-${accountId}`,
        type: 'cloud',
        login: accountId,
        password: password,
        server: server,
        platform: 'mt5',
        magic: 123456,
      }),
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      console.error('MetaAPI create account error:', createData);
      return { 
        success: false, 
        error: createData.message || 'Failed to provision account. Please verify your credentials.' 
      };
    }

    // Deploy the account
    await fetch(`${PROVISIONING_API_URL}/users/current/accounts/${createData.id}/deploy`, {
      method: 'POST',
      headers: {
        'auth-token': META_API_TOKEN,
      },
    });

    // Wait for deployment (poll for status)
    let deployed = false;
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(`${PROVISIONING_API_URL}/users/current/accounts/${createData.id}`, {
        headers: {
          'auth-token': META_API_TOKEN,
        },
      });
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (statusData.state === 'DEPLOYED' && statusData.connectionStatus === 'CONNECTED') {
          deployed = true;
          break;
        }
        if (statusData.state === 'DEPLOY_FAILED') {
          return { success: false, error: 'Account deployment failed. Please verify your MT5 credentials.' };
        }
      }
    }

    if (!deployed) {
      return { success: false, error: 'Account deployment timed out. Please try again.' };
    }

    return { success: true, metaApiAccountId: createData.id };
  } catch (error) {
    console.error('MetaAPI provisioning error:', error);
    return { success: false, error: 'Failed to connect to MetaAPI' };
  }
}

/**
 * Get account information from MetaAPI
 */
async function getAccountInfo(metaApiAccountId: string): Promise<{
  balance: number;
  equity: number;
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

    if (!response.ok) return null;

    const data = await response.json();
    return {
      balance: data.balance || 0,
      equity: data.equity || 0,
    };
  } catch (error) {
    console.error('Error fetching account info:', error);
    return null;
  }
}

/**
 * POST /api/user/mt5-account/connect
 * Connect a new MT5 account with real MetaAPI validation
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

    const body = await req.json();
    const { accountId, password, server } = connectSchema.parse(body);

    // Check if user already has a connected account
    const existingAccount = await prisma.mt5Account.findFirst({
      where: {
        userId: decoded.userId,
        status: 'connected',
      },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'You already have a connected MT5 account. Please disconnect it first.' },
        { status: 400 }
      );
    }

    // Provision account with MetaAPI (validates credentials)
    const provisionResult = await provisionMetaApiAccount(accountId, password, server);

    if (!provisionResult.success) {
      return NextResponse.json(
        { error: provisionResult.error || 'Failed to verify MT5 credentials' },
        { status: 400 }
      );
    }

    // Get real account balance
    let balance = 0;
    let equity = 0;
    
    if (provisionResult.metaApiAccountId) {
      const accountInfo = await getAccountInfo(provisionResult.metaApiAccountId);
      if (accountInfo) {
        balance = accountInfo.balance;
        equity = accountInfo.equity;
      }
    }

    // Create/update the account record with real data
    const mt5Account = await prisma.mt5Account.create({
      data: {
        userId: decoded.userId,
        accountId,
        server,
        apiKey: provisionResult.metaApiAccountId, // Store MetaAPI account ID
        status: 'connected',
        isConnected: true,
        balance: balance,
        equity: equity,
        lastSync: new Date(),
      },
    });

    // Log the connection
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'MT5_ACCOUNT_CONNECTED',
        details: {
          accountId,
          server,
          balance,
          equity,
        },
        ipAddress: req.headers.get('x-forwarded-for') || '',
      },
    });

    return NextResponse.json({
      message: 'MT5 account connected successfully',
      account: {
        id: mt5Account.id,
        accountId: mt5Account.accountId,
        server: mt5Account.server,
        status: mt5Account.status,
        balance: mt5Account.balance,
        equity: mt5Account.equity,
      },
    });
  } catch (error) {
    console.error('Connect MT5 account error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to connect MT5 account' },
      { status: 500 }
    );
  }
}
