import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/robots/[robotId]/stop
 * Stop a trading robot
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

    // Disable the robot
    await prisma.userRobotConfig.update({
      where: { id: userRobotConfig.id },
      data: { isEnabled: false },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'ROBOT_STOPPED',
        details: {
          robotId,
          robotName: userRobotConfig.robot.name,
        },
        ipAddress: req.headers.get('x-forwarded-for') || '',
      },
    });

    return NextResponse.json({
      message: 'Robot stopped successfully',
      robot: {
        id: userRobotConfig.robot.id,
        name: userRobotConfig.robot.name,
        status: 'stopped',
      },
    });
  } catch (error) {
    console.error('Stop robot error:', error);
    return NextResponse.json(
      { error: 'Failed to stop robot' },
      { status: 500 }
    );
  }
}
