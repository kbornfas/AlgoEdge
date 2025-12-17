import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const toggleSchema = z.object({
  robotId: z.string(),
  enabled: z.boolean(),
});

/**
 * POST /api/robots/toggle
 * Enable or disable a trading robot for the user
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { robotId, enabled } = toggleSchema.parse(body);

    // Check if robot exists
    const robot = await prisma.tradingRobot.findUnique({
      where: { id: robotId },
    });

    if (!robot) {
      return NextResponse.json({ error: 'Robot not found' }, { status: 404 });
    }

    // Check if user is activated
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isActivated: true },
    });

    if (!user?.isActivated) {
      return NextResponse.json(
        { error: 'Account not activated. Please submit payment proof first.' },
        { status: 403 }
      );
    }

    // Upsert user robot configuration
    const config = await prisma.userRobotConfig.upsert({
      where: {
        userId_robotId: {
          userId: decoded.userId,
          robotId,
        },
      },
      update: {
        isEnabled: enabled,
        updatedAt: new Date(),
      },
      create: {
        userId: decoded.userId,
        robotId,
        isEnabled: enabled,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: enabled ? 'ROBOT_ENABLED' : 'ROBOT_DISABLED',
        details: {
          robotId,
          robotName: robot.name,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
      },
    });

    return NextResponse.json({
      message: `Robot ${enabled ? 'enabled' : 'disabled'} successfully`,
      config: {
        robotId: config.robotId,
        isEnabled: config.isEnabled,
      },
    });
  } catch (error) {
    console.error('Toggle robot error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to toggle robot' },
      { status: 500 }
    );
  }
}
