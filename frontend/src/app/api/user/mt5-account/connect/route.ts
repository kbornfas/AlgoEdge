import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const connectSchema = z.object({
  accountId: z.string().min(1),
  password: z.string().min(1),
  server: z.string().min(1),
});

/**
 * POST /api/user/mt5-account/connect
 * Connect MT5 account via backend (more reliable network)
 */
export async function POST(req: NextRequest) {
  console.log('=== MT5 Connect Request ===');
  
  try {
    // Use NEXT_PUBLIC_API_URL or BACKEND_URL
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || process.env.API_URL;
    
    if (!BACKEND_URL) {
      console.error('No BACKEND_URL or NEXT_PUBLIC_API_URL configured');
      return NextResponse.json(
        { error: 'Backend URL not configured. Set NEXT_PUBLIC_API_URL in Vercel settings to your Railway URL.' },
        { status: 500 }
      );
    }
    
    console.log('Using backend URL:', BACKEND_URL);
    
    // Remove trailing slash if present
    const backendUrl = BACKEND_URL.replace(/\/$/, '');
    
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
    
    console.log('User:', decoded.userId);
    console.log('Account:', accountId);
    console.log('Server:', server);
    console.log('Calling backend at:', backendUrl);

    // Call backend to provision account
    console.log('Calling backend /api/mt5/provision...');
    const provisionResp = await fetch(`${backendUrl}/api/mt5/provision`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accountId, password, server }),
    });

    if (!provisionResp.ok) {
      const error = await provisionResp.text();
      console.error('Backend provision failed:', provisionResp.status, error);
      return NextResponse.json(
        { error: error || 'Failed to provision account on backend' },
        { status: provisionResp.status }
      );
    }

    const provisionData = await provisionResp.json();
    console.log('Backend provision result:', provisionData);

    if (!provisionData.success && provisionData.error) {
      return NextResponse.json(
        { error: provisionData.error },
        { status: 400 }
      );
    }

    const metaApiAccountId = provisionData.metaApiAccountId;

    // Get account info from backend
    console.log('Fetching account balance from backend...');
    let balance = 0;
    let equity = 0;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      for (let attempt = 0; attempt < 5; attempt++) {
        const infoResp = await fetch(`${backendUrl}/api/mt5/account-info/${metaApiAccountId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (infoResp.ok) {
          const info = await infoResp.json();
          if (info.balance > 0 || info.equity > 0) {
            balance = info.balance;
            equity = info.equity;
            console.log('Got balance:', balance, 'equity:', equity);
            break;
          }
        }
        
        console.log('Attempt', attempt + 1, '- balance still syncing, retrying...');
        await new Promise(resolve => setTimeout(resolve, 2000 + (attempt * 1000)));
      }
    } catch (err) {
      console.log('Account info fetch error (non-critical):', err);
    }

    console.log('Final balance:', balance, 'equity:', equity);

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

    // Create account record in database
    const mt5Account = await prisma.mt5Account.create({
      data: {
        userId: decoded.userId,
        accountId,
        server,
        apiKey: metaApiAccountId,
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

    const errorMessage = error?.message || 'Unknown error';
    return NextResponse.json(
      { error: `Failed to connect MT5 account: ${errorMessage}` },
      { status: 500 }
    );
  }
}
