import express from 'express';
import webPush from 'web-push';
import pool from '../config/database.js';
import { authenticate as authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@algoedge.io';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

/**
 * Subscribe to push notifications
 * POST /api/notifications/subscribe
 */
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user.userId;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Store subscription in database
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (endpoint) 
       DO UPDATE SET user_id = $1, p256dh = $3, auth = $4, updated_at = NOW()`,
      [
        userId,
        subscription.endpoint,
        subscription.keys?.p256dh || '',
        subscription.keys?.auth || '',
      ]
    );

    // Update user settings
    await pool.query(
      `UPDATE user_settings SET push_notifications_enabled = true WHERE user_id = $1`,
      [userId]
    );

    res.json({ success: true, message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

/**
 * Unsubscribe from push notifications
 * POST /api/notifications/unsubscribe
 */
router.post('/unsubscribe', authenticateToken, async (req, res) => {
  try {
    const { endpoint } = req.body;
    const userId = req.user.userId;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    // Remove subscription from database
    await pool.query(
      'DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2',
      [endpoint, userId]
    );

    // Check if user has any remaining subscriptions
    const remaining = await pool.query(
      'SELECT COUNT(*) FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );

    if (parseInt(remaining.rows[0].count) === 0) {
      await pool.query(
        `UPDATE user_settings SET push_notifications_enabled = false WHERE user_id = $1`,
        [userId]
      );
    }

    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

/**
 * Get notification status
 * GET /api/notifications/status
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT COUNT(*) as subscription_count 
       FROM push_subscriptions 
       WHERE user_id = $1`,
      [userId]
    );

    const settingsResult = await pool.query(
      `SELECT push_notifications_enabled, email_notifications_enabled
       FROM user_settings WHERE user_id = $1`,
      [userId]
    );

    res.json({
      hasSubscription: parseInt(result.rows[0].subscription_count) > 0,
      subscriptionCount: parseInt(result.rows[0].subscription_count),
      pushEnabled: settingsResult.rows[0]?.push_notifications_enabled || false,
      emailEnabled: settingsResult.rows[0]?.email_notifications_enabled || true,
    });
  } catch (error) {
    console.error('Error getting notification status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

/**
 * Send push notification to a specific user
 * (Internal function, not exposed as route)
 */
export const sendPushNotification = async (userId, payload) => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured, skipping push notification');
    return;
  }

  try {
    // Get user's push subscriptions
    const result = await pool.query(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return;
    }

    const notificationPayload = JSON.stringify({
      title: payload.title || 'AlgoEdge Notification',
      body: payload.body || '',
      icon: payload.icon || '/images/logo.png',
      badge: '/images/logo.png',
      tag: payload.tag || 'algoedge-notification',
      data: {
        url: payload.url || '/dashboard',
        ...payload.data,
      },
      actions: payload.actions || [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });

    // Send to all user's subscriptions
    const sendPromises = result.rows.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webPush.sendNotification(pushSubscription, notificationPayload);
        console.log(`Push notification sent to user ${userId}`);
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          // Subscription is no longer valid, remove it
          console.log(`Removing invalid subscription for user ${userId}`);
          await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
        } else {
          console.error(`Failed to send push to user ${userId}:`, error);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

/**
 * Send push notification to multiple users
 */
export const sendPushToUsers = async (userIds, payload) => {
  const promises = userIds.map(userId => sendPushNotification(userId, payload));
  await Promise.allSettled(promises);
};

/**
 * Test push notification (for development)
 * POST /api/notifications/test
 */
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    await sendPushNotification(userId, {
      title: '🚀 Test Notification',
      body: 'Push notifications are working! You will receive trading alerts here.',
      url: '/dashboard',
    });

    res.json({ success: true, message: 'Test notification sent' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

export default router;
