import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { runRobotTrading, syncTrades } from '@/lib/services/metaApiTrading';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/robots/[robotId]/start
 * Start a trading robot
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

    // Verify robot exists
    const robot = await prisma.tradingRobot.findUnique({
      where: { id: robotId },
    });

    if (!robot || !robot.isActive) {
      return NextResponse.json(
        { error: 'Robot not found or inactive' },
        { status: 404 }
      );
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
        { error: 'No MT5 account connected. Please connect your account first.' },
        { status: 400 }
      );
    }

    // Get or create user robot config
    let userRobotConfig = await prisma.userRobotConfig.findUnique({
      where: {
        userId_robotId: {
          userId: decoded.userId,
          robotId: robotId,
        },
      },
    });

    if (!userRobotConfig) {
      userRobotConfig = await prisma.userRobotConfig.create({
        data: {
          userId: decoded.userId,
          robotId: robotId,
          isEnabled: true,
          settings: {
            riskPercent: 1,
            maxTrades: 5,
            tradingPairs: 'all',
          },
        },
      });
    } else {
      await prisma.userRobotConfig.update({
        where: { id: userRobotConfig.id },
        data: { isEnabled: true },
      });
    }

    // Run the robot trading logic immediately
    const result = await runRobotTrading(
      decoded.userId,
      robotId,
      mt5Account.id,
      mt5Account.accountId,
      (userRobotConfig.settings as any)?.riskPercent || 1
    );

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'ROBOT_STARTED',
        details: {
          robotId,
          robotName: robot.name,
          tradesExecuted: result.tradesExecuted,
          signals: result.signals.length,
        },
        ipAddress: req.headers.get('x-forwarded-for') || '',
      },
    });

    return NextResponse.json({
      message: 'Robot started successfully',
      robot: {
        id: robot.id,
        name: robot.name,
        status: 'running',
      },
      tradingResult: {
        tradesExecuted: result.tradesExecuted,
        signals: result.signals.map(s => ({
          symbol: s.symbol,
          type: s.type,
          confidence: s.confidence,
          reason: s.reason,
        })),
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('Start robot error:', error);
    return NextResponse.json(
      { error: 'Failed to start robot' },
      { status: 500 }
    );
  }
}
