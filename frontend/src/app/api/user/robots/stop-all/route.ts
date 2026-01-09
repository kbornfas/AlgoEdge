import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/robots/stop-all
 * Stop ALL trading robots for the user
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

    // Disable all robots for this user
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

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'ALL_ROBOTS_STOPPED',
        details: {
          robotsDisabled: result.count,
        },
        ipAddress: req.headers.get('x-forwarded-for') || '',
      },
    });

    console.log(`Stopped ${result.count} robots for user ${decoded.userId}`);

    return NextResponse.json({
      message: `Stopped ${result.count} robot(s)`,
      stoppedCount: result.count,
    });
  } catch (error) {
    console.error('Stop all robots error:', error);
    return NextResponse.json(
      { error: 'Failed to stop robots' },
      { status: 500 }
    );
  }
}
