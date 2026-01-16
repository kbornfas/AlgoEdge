import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  generateConnectionToken,
  getTelegramConnectLink,
  storePendingConnection,
  disconnectTelegram,
  getTelegramStatus,
  handleTelegramWebhook,
} from '../services/telegramService.js';

const router = express.Router();

/**
 * GET /api/telegram/status
 * Get user's Telegram connection status
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const status = await getTelegramStatus(req.user.id);
    res.json(status);
  } catch (error) {
    console.error('Error getting Telegram status:', error);
    res.status(500).json({ error: 'Failed to get Telegram status' });
  }
});

/**
 * POST /api/telegram/connect
 * Generate a connection link for user to connect their Telegram
 */
router.post('/connect', authenticate, async (req, res) => {
  try {
    // Check if already connected
    const status = await getTelegramStatus(req.user.id);
    if (status.connected) {
      return res.status(400).json({ 
        error: 'Telegram already connected',
        username: status.username
      });
    }

    // Generate connection token
    const token = generateConnectionToken(req.user.id);
    
    // Store pending connection
    await storePendingConnection(req.user.id, token);
    
    // Generate deep link
    const connectLink = getTelegramConnectLink(token);

    res.json({
      success: true,
      connectLink,
      botUsername: process.env.TELEGRAM_BOT_USERNAME || 'Algoedge_rs_bot',
      expiresIn: '10 minutes',
    });
  } catch (error) {
    console.error('Error generating Telegram connect link:', error);
    res.status(500).json({ error: 'Failed to generate connection link' });
  }
});

/**
 * POST /api/telegram/disconnect
 * Disconnect user's Telegram
 */
router.post('/disconnect', authenticate, async (req, res) => {
  try {
    const success = await disconnectTelegram(req.user.id);
    
    if (success) {
      res.json({ success: true, message: 'Telegram disconnected' });
    } else {
      res.status(500).json({ error: 'Failed to disconnect Telegram' });
    }
  } catch (error) {
    console.error('Error disconnecting Telegram:', error);
    res.status(500).json({ error: 'Failed to disconnect Telegram' });
  }
});

/**
 * POST /api/telegram/webhook
 * Webhook endpoint for Telegram bot updates
 * This should be called by Telegram when users interact with the bot
 */
router.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    
    // Log incoming update (for debugging)
    console.log('📱 Telegram webhook update:', JSON.stringify(update, null, 2));
    
    const result = await handleTelegramWebhook(update);
    
    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ ok: true, result });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    // Still return 200 to prevent Telegram from retrying
    res.status(200).json({ ok: true, error: 'Handled with error' });
  }
});

/**
 * GET /api/telegram/set-webhook
 * Utility endpoint to set up the Telegram webhook (call once during deployment)
 */
router.get('/set-webhook', async (req, res) => {
  try {
    const webhookUrl = req.query.url || `${process.env.BACKEND_URL}/api/telegram/webhook`;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      return res.status(500).json({ error: 'Telegram bot token not configured' });
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
    );
    
    const data = await response.json();
    
    res.json({
      success: data.ok,
      webhookUrl,
      telegramResponse: data,
    });
  } catch (error) {
    console.error('Error setting Telegram webhook:', error);
    res.status(500).json({ error: 'Failed to set webhook' });
  }
});

/**
 * GET /api/telegram/webhook-info
 * Get current webhook info
 */
router.get('/webhook-info', async (req, res) => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      return res.status(500).json({ error: 'Telegram bot token not configured' });
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getWebhookInfo`
    );
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error getting webhook info:', error);
    res.status(500).json({ error: 'Failed to get webhook info' });
  }
});

export default router;
