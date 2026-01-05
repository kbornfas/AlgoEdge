import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const connectSchema = z.object({
  accountId: z.string().min(1),
  password: z.string().min(1),
  server: z.string().min(1),
});

/**
 * POST /api/user/mt5-account/connect
 * Connect a new MT5 account
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

    const body = await req.json();
    const { accountId, password, server } = connectSchema.parse(body);

    // Check if user already has a connected account
    const existingAccount = await prisma.mt5Account.findFirst({
      where: {
        userId: decoded.userId,
        status: 'connected',
      },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'You already have a connected MT5 account. Please disconnect it first.' },
        { status: 400 }
      );
    }

    // TODO: Validate credentials with MetaAPI
    // In production, you would:
    // 1. Call MetaAPI to verify the credentials
    // 2. Get the account balance/equity
    // 3. Set up streaming for real-time updates

    // For now, create the account record
    const mt5Account = await prisma.mt5Account.create({
      data: {
        userId: decoded.userId,
        accountId,
        server,
        status: 'connected',
        // In production, these would come from MetaAPI
        balance: 0,
        equity: 0,
      },
    });

    // Log the connection
    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'MT5_ACCOUNT_CONNECTED',
        details: {
          accountId,
          server,
        },
        ipAddress: req.headers.get('x-forwarded-for') || '',
      },
    });

    return NextResponse.json({
      message: 'MT5 account connected successfully',
      account: {
        id: mt5Account.id,
        accountId: mt5Account.accountId,
        server: mt5Account.server,
        status: mt5Account.status,
      },
    });
  } catch (error) {
    console.error('Connect MT5 account error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to connect MT5 account' },
      { status: 500 }
    );
  }
}
