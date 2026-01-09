import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/robots/[robotId]/start
 * Enable a trading robot - backend scheduler handles actual trading
 * 
 * Trading is handled by the backend tradingScheduler service which:
 * - Runs continuously in the background
 * - Only trades for robots where isEnabled = true
 * - Continues even when user closes browser
 * - Manages TP/SL and position management
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

    // Parse request body for timeframe and risk settings
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // No body provided, use defaults
    }

    const selectedTimeframe = body.timeframe || 'H1';
    const riskPercent = body.riskPercent || 1;

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

    // Get the MetaAPI account ID (stored in apiKey field)
    const metaApiAccountId = mt5Account.apiKey;
    if (!metaApiAccountId) {
      return NextResponse.json(
        { error: 'MT5 account is not properly configured. Please disconnect and reconnect.' },
        { status: 400 }
      );
    }

    console.log(`🤖 Enabling ${robot.name} for user ${decoded.userId}`);
    console.log(`   Timeframe: ${selectedTimeframe}, Risk: ${riskPercent}%`);
    console.log(`   MetaAPI Account: ${metaApiAccountId}`);

    // Configuration settings for the robot
    const configSettings = {
      riskPercent,
      timeframe: selectedTimeframe,
      maxTrades: 5,
      tradingPairs: body.pairs || 'all',
    };

    // Get or create user robot config and ENABLE it
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
          settings: configSettings,
        },
      });
    } else {
      await prisma.userRobotConfig.update({
        where: { id: userRobotConfig.id },
        data: { 
          isEnabled: true,
          settings: configSettings,
          updatedAt: new Date(),
        },
      });
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'ROBOT_STARTED',
        details: {
          robotId,
          robotName: robot.name,
          timeframe: selectedTimeframe,
          riskPercent,
          metaApiAccountId,
        },
        ipAddress: req.headers.get('x-forwarded-for') || '',
      },
    });

    return NextResponse.json({
      message: `${robot.name} is now running. Trading will continue in the background.`,
      robot: {
        id: robot.id,
        name: robot.name,
        status: 'running',
        timeframe: selectedTimeframe,
        riskPercent,
      },
      info: 'The backend trading scheduler will open and manage trades automatically. ' +
            'Trading continues even if you close your browser. ' +
            'Click "Stop Robot" to disable trading and close all positions.',
    });
  } catch (error) {
    console.error('Start robot error:', error);
    return NextResponse.json(
      { error: 'Failed to start robot' },
      { status: 500 }
    );
  }
}
