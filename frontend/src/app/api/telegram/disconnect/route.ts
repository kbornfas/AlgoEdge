import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Send a message to Telegram
 */
async function sendTelegramMessage(chatId: string, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return false;
  
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
    return true;
  } catch {
    return false;
  }
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

    // Get chat ID before disconnecting
    const settings = await prisma.$queryRaw<Array<{ telegram_chat_id: string | null }>>`
      SELECT telegram_chat_id FROM user_settings WHERE user_id = ${decoded.userId}
    `;

    const chatId = settings[0]?.telegram_chat_id;

    // Clear Telegram settings
    await prisma.$executeRaw`
      UPDATE user_settings 
      SET telegram_chat_id = NULL, telegram_alerts = false, telegram_username = NULL
      WHERE user_id = ${decoded.userId}
    `;

    // Send goodbye message if we had a chat ID
    if (chatId) {
      await sendTelegramMessage(chatId,
        '👋 <b>Disconnected from AlgoEdge</b>\n\n' +
        'Your Telegram has been unlinked from your AlgoEdge account.\n\n' +
        'You will no longer receive trade alerts here.\n' +
        'To reconnect, visit Settings in your AlgoEdge dashboard.'
      );
    }

    return NextResponse.json({ success: true, message: 'Telegram disconnected' });
  } catch (error) {
    console.error('Telegram disconnect error:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
