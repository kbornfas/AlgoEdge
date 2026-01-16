import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * GET /api/telegram/set-webhook
 * Set up the Telegram webhook to point to our endpoint
 */
export async function GET(req: NextRequest) {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: 'Telegram bot token not configured' }, { status: 500 });
    }

    // Get the app URL from environment or request
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const webhookUrl = `${appUrl}/api/telegram/webhook`;

    // Set the webhook
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message'],
        }),
      }
    );

    const data = await response.json();

    return NextResponse.json({
      success: data.ok,
      webhookUrl,
      telegramResponse: data,
    });
  } catch (error) {
    console.error('Error setting Telegram webhook:', error);
    return NextResponse.json({ error: 'Failed to set webhook' }, { status: 500 });
  }
}
