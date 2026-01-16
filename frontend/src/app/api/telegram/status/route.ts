import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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

    // Get Telegram status from database using raw SQL
    const settings = await prisma.$queryRaw<Array<{
      telegram_chat_id: string | null;
      telegram_alerts: boolean;
      telegram_username: string | null;
    }>>`
      SELECT telegram_chat_id, telegram_alerts, telegram_username 
      FROM user_settings 
      WHERE user_id = ${decoded.userId}
    `;

    if (settings.length === 0) {
      return NextResponse.json({ connected: false });
    }

    const setting = settings[0];
    return NextResponse.json({
      connected: !!setting.telegram_chat_id,
      chatId: setting.telegram_chat_id,
      alertsEnabled: setting.telegram_alerts,
      username: setting.telegram_username,
    });
  } catch (error) {
    console.error('Telegram status error:', error);
    return NextResponse.json({ connected: false });
  }
}
