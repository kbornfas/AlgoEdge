import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/robots
 * Get user's available trading robots and their status
 * The database is the SINGLE SOURCE OF TRUTH for robot running state
 */
export async function GET(req: NextRequest) {
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

    // Check if user has a connected MT5 account
    const mt5Account = await prisma.mt5Account.findFirst({
      where: {
        userId: decoded.userId,
        status: 'connected',
      },
    });

    if (!mt5Account) {
      return NextResponse.json({
        robots: [],
        message: 'No MT5 account connected',
      });
    }

    // Get ALL available robots from database
    const availableRobots = await prisma.tradingRobot.findMany({
      where: { isActive: true },
    });

    // Get user's robot configurations (this tells us which are enabled/running)
    const userRobots = await prisma.userRobotConfig.findMany({
      where: { userId: decoded.userId },
    });

    // Create a map of user's robot configs for quick lookup
    const userRobotMap = new Map(
      userRobots.map((ur) => [ur.robotId, ur])
    );

    // Return ALL robots with their status based on database isEnabled field
    const robotsWithStatus = availableRobots.map((robot) => {
      const userConfig = userRobotMap.get(robot.id);
      return {
        id: robot.id,
        name: robot.name,
        description: robot.description,
        strategy: robot.strategy,
        timeframe: robot.timeframe,
        timeframes: robot.timeframes,
        pairs: robot.pairs,
        riskLevel: robot.riskLevel,
        winRate: robot.winRate,
        // CRITICAL: status is determined by database isEnabled field
        status: userConfig?.isEnabled === true ? 'running' : 'stopped',
        isAssigned: !!userConfig,
        settings: userConfig?.settings || null,
      };
    });

    return NextResponse.json({
      robots: robotsWithStatus,
      mt5Connected: true,
    });
  } catch (error) {
    console.error('Get robots error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch robots' },
      { status: 500 }
    );
  }
}
