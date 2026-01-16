import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import crypto from 'crypto';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'Algoedge_rs_bot';

/**
 * Generate a unique connection token for a user
 */
function generateConnectionToken(userId: number): string {
  const payload = `${userId}-${Date.now()}`;
  const token = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret')
    .update(payload)
    .digest('hex')
    .substring(0, 32);
  return token;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token) as { userId: number } | null;

    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if already connected
    const existing = await prisma.$queryRaw<Array<{ telegram_chat_id: string | null }>>`
      SELECT telegram_chat_id FROM user_settings WHERE user_id = ${decoded.userId}
    `;

    if (existing.length > 0 && existing[0].telegram_chat_id) {
      return NextResponse.json({ 
        error: 'Telegram already connected'
      }, { status: 400 });
    }

    // Generate connection token
    const connectionToken = generateConnectionToken(decoded.userId);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store pending connection
    await prisma.$executeRaw`
      INSERT INTO telegram_pending_connections (user_id, token, expires_at)
      VALUES (${decoded.userId}, ${connectionToken}, ${expiresAt})
      ON CONFLICT (user_id) DO UPDATE SET token = ${connectionToken}, expires_at = ${expiresAt}
    `;

    // Generate deep link
    const connectLink = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${connectionToken}`;

    return NextResponse.json({
      success: true,
      connectLink,
      botUsername: TELEGRAM_BOT_USERNAME,
      expiresIn: '10 minutes',
    });
  } catch (error) {
    console.error('Telegram connect error:', error);
    return NextResponse.json({ error: 'Failed to generate link' }, { status: 500 });
  }
}
