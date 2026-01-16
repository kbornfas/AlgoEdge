import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Send a message to Telegram
 */
async function sendTelegramMessage(chatId: string | number, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return false;
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}

/**
 * POST /api/telegram/webhook
 * Webhook endpoint for Telegram bot updates
 */
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    console.log('📱 Telegram webhook update:', JSON.stringify(update, null, 2));

    const message = update.message;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text || '';
    const telegramUsername = message.from?.username || '';

    // Handle /start command with connection token
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const token = parts[1]; // Token from deep link

      if (token) {
        // Find pending connection with this token
        const pending = await prisma.$queryRaw<Array<{user_id: number}>>`
          SELECT user_id FROM telegram_pending_connections 
          WHERE token = ${token} AND expires_at > NOW()
        `;

        if (pending.length > 0) {
          const userId = pending[0].user_id;

          // Update user settings with Telegram chat ID
          await prisma.userSettings.upsert({
            where: { userId },
            update: {
              telegramChatId: chatId.toString(),
              telegramAlerts: true,
              telegramUsername,
            },
            create: {
              userId,
              telegramChatId: chatId.toString(),
              telegramAlerts: true,
              telegramUsername,
            },
          });

          // Delete pending connection
          await prisma.$executeRaw`
            DELETE FROM telegram_pending_connections WHERE user_id = ${userId}
          `;

          // Get user info
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { username: true },
          });

          // Send welcome message
          await sendTelegramMessage(chatId,
            `🎉 <b>Connected Successfully!</b>\n\n` +
            `Welcome, <b>${user?.username || 'Trader'}</b>!\n\n` +
            `Your Telegram is now linked to your AlgoEdge account.\n\n` +
            `📊 You will receive:\n` +
            `• Trade open/close alerts\n` +
            `• Daily performance summaries\n` +
            `• Important account notifications\n\n` +
            `<b>Commands:</b>\n` +
            `/status - Check connection status\n` +
            `/mute - Mute alerts\n` +
            `/unmute - Unmute alerts\n` +
            `/help - Show help\n\n` +
            `Happy trading! 🚀`
          );

          return NextResponse.json({ ok: true, action: 'connected' });
        } else {
          await sendTelegramMessage(chatId,
            '❌ <b>Link Expired</b>\n\n' +
            'This connection link has expired.\n' +
            'Please generate a new link from your AlgoEdge Settings.'
          );
          return NextResponse.json({ ok: true, action: 'expired' });
        }
      } else {
        // Just /start without token
        await sendTelegramMessage(chatId,
          `👋 <b>Welcome to AlgoEdge Bot!</b>\n\n` +
          `To connect your account:\n` +
          `1. Go to algoedgehub.com\n` +
          `2. Open Settings → Telegram\n` +
          `3. Click "Connect Telegram"\n` +
          `4. Follow the link back here\n\n` +
          `Already connected? Try /status`
        );
        return NextResponse.json({ ok: true, action: 'welcome' });
      }
    }

    // Handle /status command
    if (text === '/status') {
      const settings = await prisma.userSettings.findFirst({
        where: { telegramChatId: chatId.toString() },
        include: { user: { select: { username: true } } },
      });

      if (settings) {
        await sendTelegramMessage(chatId,
          `✅ <b>Connected</b>\n\n` +
          `Account: <code>${settings.user.username}</code>\n` +
          `Alerts: ${settings.telegramAlerts ? '🔔 Enabled' : '🔕 Disabled'}`
        );
      } else {
        await sendTelegramMessage(chatId,
          '❌ <b>Not Connected</b>\n\n' +
          'This Telegram is not linked to any AlgoEdge account.\n' +
          'Connect via Settings → Telegram Integration'
        );
      }
      return NextResponse.json({ ok: true, action: 'status' });
    }

    // Handle /mute command
    if (text === '/mute') {
      await prisma.userSettings.updateMany({
        where: { telegramChatId: chatId.toString() },
        data: { telegramAlerts: false },
      });
      await sendTelegramMessage(chatId, '🔕 Alerts muted. Use /unmute to resume.');
      return NextResponse.json({ ok: true, action: 'muted' });
    }

    // Handle /unmute command
    if (text === '/unmute') {
      await prisma.userSettings.updateMany({
        where: { telegramChatId: chatId.toString() },
        data: { telegramAlerts: true },
      });
      await sendTelegramMessage(chatId, '🔔 Alerts resumed!');
      return NextResponse.json({ ok: true, action: 'unmuted' });
    }

    // Handle /help command
    if (text === '/help') {
      await sendTelegramMessage(chatId,
        '📚 <b>AlgoEdge Bot Help</b>\n\n' +
        '<b>Commands:</b>\n' +
        '/start - Start the bot\n' +
        '/status - Check connection status\n' +
        '/mute - Mute all alerts\n' +
        '/unmute - Unmute alerts\n' +
        '/help - Show this help\n\n' +
        '<b>Need support?</b>\n' +
        'Visit: algoedgehub.com'
      );
      return NextResponse.json({ ok: true, action: 'help' });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    // Still return 200 to prevent Telegram from retrying
    return NextResponse.json({ ok: true, error: 'Handled with error' });
  }
}
