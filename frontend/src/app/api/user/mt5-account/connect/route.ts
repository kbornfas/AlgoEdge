import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for connection

const PROVISIONING_API_URL = 'https://mt-provisioning-api-v1.agiliumtrade.ai';

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
  const META_API_TOKEN = process.env.METAAPI_TOKEN;
  
  if (!META_API_TOKEN) {
    console.error('METAAPI_TOKEN not configured');
    return { success: false, error: 'MetaAPI token not configured. Contact admin.' };
  }

  const headers = { 
    'auth-token': META_API_TOKEN,
    'Content-Type': 'application/json',
  };

  try {
    console.log('Checking for existing MetaAPI account...');
    
    // First, check if account already exists in MetaAPI
    const listResponse = await fetch(`${PROVISIONING_API_URL}/users/current/accounts`, { headers });
    if (!listResponse.ok) throw new Error(`List failed: HTTP ${listResponse.status}`);
    const accounts = await listResponse.json();
    console.log('Found', accounts.length, 'MetaAPI accounts');
    
    // Compare as strings to handle type mismatch
    const existingAccount = accounts.find((acc: any) => 
      String(acc.login) === String(accountId) && acc.server === server
    );
    
    if (existingAccount) {
      console.log('Found existing account:', existingAccount._id, 'state:', existingAccount.state, 'connection:', existingAccount.connectionStatus);
      
      // Account exists, deploy it if needed
      if (existingAccount.state !== 'DEPLOYED') {
        console.log('Deploying existing account...');
        await fetch(`${PROVISIONING_API_URL}/users/current/accounts/${existingAccount._id}/deploy`, { 
          method: 'POST', 
          headers 
        });
        
        // Wait for deployment
        for (let i = 0; i < 20; i++) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            const statusResponse = await fetch(`${PROVISIONING_API_URL}/users/current/accounts/${existingAccount._id}`, { headers });
            const statusData = await statusResponse.json();
            console.log('Account status:', statusData.state, statusData.connectionStatus);
            if (statusData.state === 'DEPLOYED' && statusData.connectionStatus === 'CONNECTED') {
              break;
            }
          } catch (e) {
            console.log('Status check error, retrying...');
          }
        }
      } else if (existingAccount.connectionStatus !== 'CONNECTED') {
        // Account is deployed but not connected - wait for connection
        console.log('Account deployed but not connected, waiting...');
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            const statusResponse = await fetch(`${PROVISIONING_API_URL}/users/current/accounts/${existingAccount._id}`, { headers });
            const statusData = await statusResponse.json();
            if (statusData.connectionStatus === 'CONNECTED') {
              console.log('Account now connected!');
              break;
            }
          } catch (e) {
            console.log('Connection check error, retrying...');
          }
        }
      }
      return { success: true, metaApiAccountId: existingAccount._id };
    }

    console.log('Creating new MetaAPI account for', accountId, 'on', server);

    // Create new account in MetaAPI
    const createResponse = await fetch(`${PROVISIONING_API_URL}/users/current/accounts`, {
      method: 'POST',
      headers,
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

    if (!createResponse.ok) throw new Error(`Create failed: HTTP ${createResponse.status}`);
    const createData = await createResponse.json();
    console.log('Account created with ID:', createData.id);

    // Deploy the account
    console.log('Deploying new account...');
    await fetch(`${PROVISIONING_API_URL}/users/current/accounts/${createData.id}/deploy`, { 
      method: 'POST', 
      headers 
    });

    // Wait for deployment and connection (poll for status)
    let deployed = false;
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const statusResponse = await fetch(`${PROVISIONING_API_URL}/users/current/accounts/${createData.id}`, { headers });
        const statusData = await statusResponse.json();
        console.log('Deployment status:', statusData.state, statusData.connectionStatus);
        
        if (statusData.state === 'DEPLOYED' && statusData.connectionStatus === 'CONNECTED') {
          deployed = true;
          break;
        }
        if (statusData.state === 'DEPLOY_FAILED') {
          return { success: false, error: 'Account deployment failed. Please verify your MT5 credentials and server name.' };
        }
      } catch (e) {
        console.log('Status check failed, retrying...');
      }
    }

    if (!deployed) {
      // Even if not fully connected yet, return success - user can refresh later
      console.log('Account may still be deploying, returning ID anyway');
      return { success: true, metaApiAccountId: createData.id };
    }

    return { success: true, metaApiAccountId: createData.id };
  } catch (error: any) {
    console.error('MetaAPI provisioning error:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.message || error.message || 'Failed to connect to MetaAPI';
    return { success: false, error: errorMsg };
  }
}

/**
 * Get account information from MetaAPI (with region detection)
 */
async function getAccountInfo(metaApiAccountId: string): Promise<{
  balance: number;
  equity: number;
} | null> {
  const META_API_TOKEN = process.env.METAAPI_TOKEN;
  
  if (!META_API_TOKEN) {
    console.error('No META_API_TOKEN for getAccountInfo');
    return null;
  }

  const headers = { 
    'auth-token': META_API_TOKEN,
    'Content-Type': 'application/json',
  };

  try {
    console.log('Fetching account info for MetaAPI account:', metaApiAccountId);
    
    // First get account details to find region
    const accountResponse = await fetch(
      `${PROVISIONING_API_URL}/users/current/accounts/${metaApiAccountId}`,
      { headers }
    );
    
    if (!accountResponse.ok) throw new Error(`HTTP ${accountResponse.status}`);
    const accountData = await accountResponse.json();
    const region = accountData.region || 'vint-hill';
    const regionClientApiMap: Record<string, string> = {
      'vint-hill': 'https://mt-client-api-v1.vint-hill.agiliumtrade.ai',
      'new-york': 'https://mt-client-api-v1.new-york.agiliumtrade.ai',
      'london': 'https://mt-client-api-v1.london.agiliumtrade.ai',
      'singapore': 'https://mt-client-api-v1.singapore.agiliumtrade.ai',
    };
    const clientApiUrl = regionClientApiMap[region] || 'https://mt-client-api-v1.vint-hill.agiliumtrade.ai';
    
    console.log('Account region:', region, 'using:', clientApiUrl);
    
    const response = await fetch(
      `${clientApiUrl}/users/current/accounts/${metaApiAccountId}/account-information`,
      { headers }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log('Account info received:', JSON.stringify(data));
    
    return {
      balance: data.balance || 0,
      equity: data.equity || data.balance || 0,
    };
  } catch (error: any) {
    console.error('Error fetching account info:', error.message);
    return null;
  }
}

/**
 * POST /api/user/mt5-account/connect
 * Connect a new MT5 account with real MetaAPI validation
 */
export async function POST(req: NextRequest) {
  console.log('=== MT5 Connect Request Started ===');
  
  try {
    // Check MetaAPI token first
    const META_API_TOKEN = process.env.METAAPI_TOKEN;
    if (!META_API_TOKEN) {
      console.error('METAAPI_TOKEN not configured');
      return NextResponse.json(
        { error: 'MetaAPI not configured. Contact admin to add METAAPI_TOKEN in Vercel settings.' },
        { status: 500 }
      );
    }
    
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
    
    console.log('=== MT5 Connect Request ===');
    console.log('User:', decoded.userId);
    console.log('Account:', accountId);
    console.log('Server:', server);

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
    console.log('Provisioning MetaAPI account...');
    const provisionResult = await provisionMetaApiAccount(accountId, password, server);
    console.log('Provision result:', provisionResult);

    if (!provisionResult.success) {
      return NextResponse.json(
        { error: provisionResult.error || 'Failed to verify MT5 credentials' },
        { status: 400 }
      );
    }

    // Get real account balance - retry multiple times with increasing delays
    let balance = 0;
    let equity = 0;
    
    if (provisionResult.metaApiAccountId) {
      console.log('Fetching account balance...');
      
      // Wait a bit for sync to happen
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Try multiple times as account may need time to sync
      for (let attempt = 0; attempt < 8; attempt++) {
        const accountInfo = await getAccountInfo(provisionResult.metaApiAccountId);
        if (accountInfo && (accountInfo.balance > 0 || accountInfo.equity > 0)) {
          balance = accountInfo.balance;
          equity = accountInfo.equity;
          console.log('Got balance:', balance, 'equity:', equity);
          break;
        }
        console.log('Attempt', attempt + 1, '- balance is 0, waiting for sync...');
        // Progressive delay: 2s, 3s, 4s, 5s...
        await new Promise(resolve => setTimeout(resolve, 2000 + (attempt * 1000)));
      }
      
      // If still 0, that's okay - user can refresh later
      if (balance === 0) {
        console.log('Balance still 0 - account may need more time to sync. User can refresh later.');
      }
    }

    console.log('Final balance:', balance, 'equity:', equity);

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
  } catch (error: any) {
    console.error('Connect MT5 account error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    // Return more detailed error message
    const errorMessage = error?.message || 'Unknown error';
    return NextResponse.json(
      { error: `Failed to connect MT5 account: ${errorMessage}` },
      { status: 500 }
    );
  }
}
