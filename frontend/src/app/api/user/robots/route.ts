import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/robots
 * Get user's available trading robots and their status
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

    // Get user's robot configurations
    const userRobots = await prisma.userRobotConfig.findMany({
      where: { userId: decoded.userId },
      include: {
        robot: true,
      },
    });

    // Get all available robots if user has none assigned
    if (userRobots.length === 0) {
      const availableRobots = await prisma.tradingRobot.findMany({
        where: { isActive: true },
      });

      return NextResponse.json({
        robots: availableRobots.map((robot) => ({
          id: robot.id,
          name: robot.name,
          description: robot.description,
          status: 'stopped',
          profit: 0,
          isAssigned: false,
        })),
      });
    }

    return NextResponse.json({
      robots: userRobots.map((ur) => ({
        id: ur.robot.id,
        name: ur.robot.name,
        description: ur.robot.description,
        status: ur.isEnabled ? 'running' : 'stopped',
        profit: 0,
        isAssigned: true,
        settings: ur.settings,
      })),
    });
  } catch (error) {
    console.error('Get robots error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch robots' },
      { status: 500 }
    );
  }
}
