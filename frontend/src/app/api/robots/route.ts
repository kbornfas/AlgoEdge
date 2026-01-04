import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Mark as dynamic route since it uses authentication headers
export const dynamic = 'force-dynamic';

/**
 * GET /api/robots
 * Get all available trading robots with user configurations
 */
export async function GET(req: NextRequest) {
  try {
    // Verify user token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token) as any;

    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get all active robots
    const robots = await prisma.tradingRobot.findMany({
      where: { isActive: true },
      orderBy: [
        { timeframe: 'asc' },
        { winRate: 'desc' },
      ],
    });

    // Get user's robot configurations
    const userConfigs = await prisma.userRobotConfig.findMany({
      where: { userId: decoded.userId },
    });

    // Merge robots with user configurations
    const robotsWithConfig = robots.map((robot) => {
      const config = userConfigs.find((c) => c.robotId === robot.id);
      return {
        ...robot,
        isEnabled: config?.isEnabled || false,
        settings: config?.settings || {},
      };
    });

    return NextResponse.json({
      robots: robotsWithConfig,
      total: robots.length,
    });
  } catch (error) {
    console.error('Get robots error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch robots' },
      { status: 500 }
    );
  }
}
