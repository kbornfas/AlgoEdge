import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for connection

const PROVISIONING_API_URL = 'https://mt-provisioning-api-v1.agiliumtrade.ai';

// Test basic connectivity to MetaAPI
async function testMetaApiConnectivity(token: string) {
  try {
    console.log('[test] Checking MetaAPI connectivity...');
    const response = await fetch(`${PROVISIONING_API_URL}/users/current/profile`, {
      method: 'GET',
      headers: {
        'auth-token': token,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    console.log(`[test] MetaAPI connectivity check: ${response.status} ${response.statusText}`);
    if (!response.ok) {
      const body = await response.text();
      console.log('[test] Error response:', body);
    }
    return response.ok;
  } catch (error: any) {
    console.error('[test] MetaAPI connectivity failed:', error.message);
    console.error('[test] Error details:', {
      cause: error.cause,
      code: error.code,
      errno: error.errno,
    });
    return false;
  }
}

// Fetch with timeout to avoid hanging requests
async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    console.log(`[fetch] ${options.method || 'GET'} ${url}`);
    const response = await fetch(url, { ...options, signal: controller.signal });
    console.log(`[fetch] Response: ${response.status} ${response.statusText}`);
    return response;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error(`[fetch] FAILED on ${url}:`, errMsg);
    console.error(`[fetch] Error cause:`, err?.cause);
    console.error(`[fetch] Error code:`, err?.code);
    console.error(`[fetch] Error errno:`, err?.errno);
    if (err.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms to ${url}`);
    }
    // Re-throw with more context
    throw new Error(`Fetch failed on ${url}: ${errMsg}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

// Helper to throw if response is not OK
async function ensureOk(response: Response, context: string) {
  if (response.ok) return;
  let body: any = null;
  try {
    const text = await response.text();
    try {
      body = JSON.parse(text || '{}');
    } catch {
      body = text;
    }
  } catch {}
  const detail = typeof body === 'string' ? body : body?.message || body?.error || JSON.stringify(body || {});
  throw new Error(`${context} failed: HTTP ${response.status}${detail ? ` - ${detail}` : ''}`);
}

const connectSchema = z.object({
  accountId: z.string().min(1),
  password: z.string().min(1),
  server: z.string().min(1),
});

/**
 * Create or find MetaAPI account for the MT5 credentials
 */
async function provisionMetaApiAccount(
  accountId: string,
  password: string,
  server: string
): Promise<{
  success: boolean;
  metaApiAccountId?: string;
  error?: string;
}> {
  const META_API_TOKEN = process.env.METAAPI_TOKEN;
  
  console.log('[provisionMetaApiAccount] METAAPI_TOKEN check:', !!META_API_TOKEN);
  if (!META_API_TOKEN) {
    console.error('[provisionMetaApiAccount] METAAPI_TOKEN not configured');
    return { success: false, error: 'MetaAPI token not configured. Contact admin.' };
  }

  const headers = { 
    'auth-token': META_API_TOKEN,
    'Content-Type': 'application/json',
  };

  try {
    console.log('Checking for existing MetaAPI account...');
    
    // First, check if account already exists in MetaAPI
    const listResponse = await fetchWithTimeout(`${PROVISIONING_API_URL}/users/current/accounts`, { headers });
    await ensureOk(listResponse, 'List accounts');
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
        const deployResp = await fetchWithTimeout(`${PROVISIONING_API_URL}/users/current/accounts/${existingAccount._id}/deploy`, { 
          method: 'POST', 
          headers 
        });
        await ensureOk(deployResp, 'Deploy existing');
        
        // Wait for deployment
        for (let i = 0; i < 20; i++) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            const statusResponse = await fetchWithTimeout(`${PROVISIONING_API_URL}/users/current/accounts/${existingAccount._id}`, { headers });
            await ensureOk(statusResponse, 'Status existing');
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
            const statusResponse = await fetchWithTimeout(`${PROVISIONING_API_URL}/users/current/accounts/${existingAccount._id}`, { headers });
            await ensureOk(statusResponse, 'Status existing');
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
    const createResponse = await fetchWithTimeout(`${PROVISIONING_API_URL}/users/current/accounts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        login: accountId,
        password,
        server,
        platform: 'mt5',
        application: 'MetaApi',
        reliability: 'high',
      })
    });
    await ensureOk(createResponse, 'Create account');
    const createData = await createResponse.json();
    console.log('Account created with ID:', createData.id);

    // Deploy the account
    console.log('Deploying new account...');
    const deployRespNew = await fetchWithTimeout(`${PROVISIONING_API_URL}/users/current/accounts/${createData.id}/deploy`, { 
      method: 'POST', 
      headers 
    });
    await ensureOk(deployRespNew, 'Deploy new');

    // Wait for deployment and connection (poll for status)
    let deployed = false;
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const statusResponse = await fetchWithTimeout(`${PROVISIONING_API_URL}/users/current/accounts/${createData.id}`, { headers });
        await ensureOk(statusResponse, 'Status new');
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
    const fullError = error instanceof Error ? error.message : String(error);
    console.error('MetaAPI provisioning error:', fullError);
    console.error('Error stack:', error?.stack);
    console.error('Error type:', error?.constructor?.name);
    const errorMsg = fullError || 'Failed to connect to MetaAPI';
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
    const accountResponse = await fetchWithTimeout(
      `${PROVISIONING_API_URL}/users/current/accounts/${metaApiAccountId}`,
      { headers }
    );
    
    await ensureOk(accountResponse, 'Get account details');
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
    
    const response = await fetchWithTimeout(
      `${clientApiUrl}/users/current/accounts/${metaApiAccountId}/account-information`,
      { headers }
    );

    await ensureOk(response, 'Get account information');
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
  console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('META') || k.includes('API')).join(', '));
  
  try {
    // Check MetaAPI token first
    const META_API_TOKEN = process.env.METAAPI_TOKEN;
    console.log('METAAPI_TOKEN exists:', !!META_API_TOKEN);
    if (!META_API_TOKEN) {
      console.error('METAAPI_TOKEN not configured in Vercel');
      return NextResponse.json(
        { error: 'MetaAPI token not configured in Vercel environment. Set METAAPI_TOKEN in project settings.' },
        { status: 500 }
      );
    }
    console.log('METAAPI_TOKEN loaded, starting provisioning...');
    
    // Test connectivity first
    const canConnect = await testMetaApiConnectivity(META_API_TOKEN);
    if (!canConnect) {
      return NextResponse.json(
        { error: 'Cannot reach MetaAPI servers. The service may be temporarily unavailable or blocked by network. Try again in a few moments.' },
        { status: 503 }
      );
    }
    
    console.log('MetaAPI connectivity confirmed, proceeding...');
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
