import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { runRobotTrading } from '@/lib/services/metaApiTrading';

export const dynamic = 'force-dynamic';

// Timeframe mapping for MetaAPI
const TIMEFRAME_MAP: Record<string, string> = {
  'M1': '1m',
  'M5': '5m',
  'M15': '15m',
  'M30': '30m',
  'H1': '1h',
  'H4': '4h',
  'D1': '1d',
  'W1': '1w',
};

/**
 * POST /api/user/robots/[robotId]/start
 * Start a trading robot with intelligent position management
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
    const metaApiTimeframe = TIMEFRAME_MAP[selectedTimeframe] || '1h';

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

    const configSettings = {
      riskPercent,
      timeframe: selectedTimeframe,
      maxTrades: 5,
      tradingPairs: body.pairs || 'all',
    };

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
        },
      });
    }

    console.log(`🤖 Starting ${robot.name} on ${selectedTimeframe} timeframe with ${riskPercent}% risk`);

    // Run the robot trading logic with intelligent position management
    const result = await runRobotTrading(
      decoded.userId,
      robotId,
      mt5Account.id,
      mt5Account.accountId,
      riskPercent,
      metaApiTimeframe
    );

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
          tradesExecuted: result.tradesExecuted,
          tradesClosed: result.tradesClosed,
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
        timeframe: selectedTimeframe,
      },
      tradingResult: {
        tradesExecuted: result.tradesExecuted,
        tradesClosed: result.tradesClosed,
        signals: result.signals.map(s => ({
          symbol: s.symbol,
          type: s.type,
          confidence: s.confidence,
          priority: s.priority,
          riskRewardRatio: s.riskRewardRatio?.toFixed(2),
          expectedProfit: s.expectedProfit?.toFixed(2),
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
