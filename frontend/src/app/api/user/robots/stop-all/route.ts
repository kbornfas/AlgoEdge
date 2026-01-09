import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

/**
 * POST /api/user/robots/stop-all
 * Stop ALL trading robots for the user AND close all open trades
 * This disables isEnabled in the database for all user robot configs
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

    // Disable all robots for this user FIRST
    const result = await prisma.userRobotConfig.updateMany({
      where: { 
        userId: decoded.userId,
        isEnabled: true,
      },
      data: { 
        isEnabled: false,
        updatedAt: new Date(),
      },
    });

    // Get user's MT5 account
    const mt5Account = await prisma.mt5Account.findFirst({
      where: {
        userId: decoded.userId,
        status: 'connected',
      },
    });

    let tradesClosed = 0;
    let closeErrors: string[] = [];

    console.log('MT5 Account:', mt5Account?.id, 'ApiKey:', mt5Account?.apiKey ? 'present' : 'missing');
    console.log('BACKEND_URL:', BACKEND_URL);

    // Close ALL open trades via backend
    if (mt5Account?.apiKey && BACKEND_URL) {
      try {
        console.log('Calling close-all-trades with metaApiAccountId:', mt5Account.apiKey);
        
        const closeResponse = await fetch(`${BACKEND_URL}/api/mt5/close-all-trades`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metaApiAccountId: mt5Account.apiKey,
          }),
        });

        const responseText = await closeResponse.text();
        console.log('Close trades response:', closeResponse.status, responseText);

        if (closeResponse.ok) {
          const closeData = JSON.parse(responseText);
          tradesClosed = closeData.closed || 0;
          closeErrors = closeData.errors || [];
          console.log('Successfully closed', tradesClosed, 'trades');
        } else {
          console.error('Close trades failed:', closeResponse.status, responseText);
          closeErrors.push(`Backend error: ${responseText}`);
        }
      } catch (err) {
        console.error('Error closing trades via backend:', err);
        closeErrors.push('Failed to communicate with trading server');
      }
    } else {
      console.warn('Cannot close trades - missing mt5Account.apiKey or BACKEND_URL');
      if (!mt5Account?.apiKey) closeErrors.push('No MetaAPI account ID found');
      if (!BACKEND_URL) closeErrors.push('Backend URL not configured');
    }

      // Also mark all trades as closed in database
      await prisma.trade.updateMany({
        where: {
          userId: decoded.userId,
          status: 'open',
        },
        data: {
          status: 'closed',
          closeTime: new Date(),
        },
      });
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'ALL_ROBOTS_STOPPED',
        details: {
          robotsDisabled: result.count,
          tradesClosed,
          closeErrors,
        },
        ipAddress: req.headers.get('x-forwarded-for') || '',
      },
    });

    console.log(`Stopped ${result.count} robots, closed ${tradesClosed} trades for user ${decoded.userId}`);

    return NextResponse.json({
      message: `Stopped ${result.count} robot(s), closed ${tradesClosed} trade(s)`,
      stoppedCount: result.count,
      tradesClosed,
      closeErrors: closeErrors.length > 0 ? closeErrors : undefined,
    });
  } catch (error) {
    console.error('Stop all robots error:', error);
    return NextResponse.json(
      { error: 'Failed to stop robots' },
      { status: 500 }
    );
  }
}
