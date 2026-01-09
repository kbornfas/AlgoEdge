import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

/**
 * POST /api/user/robots/[robotId]/stop
 * Stop a trading robot and close all its open trades
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { robotId: string } }
) {
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

    const robotId = params.robotId;

    // Get user robot config
    const userRobotConfig = await prisma.userRobotConfig.findUnique({
      where: {
        userId_robotId: {
          userId: decoded.userId,
          robotId: robotId,
        },
      },
      include: {
        robot: true,
      },
    });

    if (!userRobotConfig) {
      return NextResponse.json(
        { error: 'Robot configuration not found' },
        { status: 404 }
      );
    }

    // Disable the robot FIRST to prevent new trades
    await prisma.userRobotConfig.update({
      where: { id: userRobotConfig.id },
      data: { isEnabled: false },
    });

    // Get user's MT5 account to close trades
    const mt5Account = await prisma.mt5Account.findFirst({
      where: {
        userId: decoded.userId,
        status: 'connected',
      },
    });

    let tradesClosed = 0;
    let closeErrors: string[] = [];

    console.log('Stopping robot:', robotId, 'for user:', decoded.userId);
    console.log('MT5 Account:', mt5Account?.id, 'ApiKey:', mt5Account?.apiKey ? 'present' : 'missing');
    console.log('BACKEND_URL:', BACKEND_URL);

    if (mt5Account?.apiKey && BACKEND_URL) {
      // Close all open trades for this robot via backend
      try {
        console.log('Calling close-robot-trades with robotId:', robotId);
        
        const closeResponse = await fetch(`${BACKEND_URL}/api/mt5/close-robot-trades`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metaApiAccountId: mt5Account.apiKey,
            robotId: robotId,
          }),
        });

        const responseText = await closeResponse.text();
        console.log('Close robot trades response:', closeResponse.status, responseText);

        if (closeResponse.ok) {
          const closeData = JSON.parse(responseText);
          tradesClosed = closeData.closed || 0;
          closeErrors = closeData.errors || [];
          console.log('Successfully closed', tradesClosed, 'trades for robot');
        } else {
          console.error('Close robot trades failed:', closeResponse.status, responseText);
          closeErrors.push(`Backend error: ${responseText}`);
        }
      } catch (err) {
        console.error('Error closing trades via backend:', err);
        closeErrors.push('Failed to communicate with trading server');
      }
    } else {
      console.warn('Cannot close trades - missing mt5Account.apiKey or BACKEND_URL');
    }
    
    if (mt5Account?.apiKey) {

      // Also mark trades as closed in database
      await prisma.trade.updateMany({
        where: {
          robotId: robotId,
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
        action: 'ROBOT_STOPPED',
        details: {
          robotId,
          robotName: userRobotConfig.robot.name,
          tradesClosed,
          closeErrors,
        },
        ipAddress: req.headers.get('x-forwarded-for') || '',
      },
    });

    return NextResponse.json({
      message: `Robot stopped successfully. ${tradesClosed} trade(s) closed.`,
      robot: {
        id: userRobotConfig.robot.id,
        name: userRobotConfig.robot.name,
        status: 'stopped',
      },
      tradesClosed,
      closeErrors: closeErrors.length > 0 ? closeErrors : undefined,
    });
  } catch (error) {
    console.error('Stop robot error:', error);
    return NextResponse.json(
      { error: 'Failed to stop robot' },
      { status: 500 }
    );
  }
}
