import Stripe from 'stripe';
import pool from '../config/database.js';
import { auditLog } from '../middleware/audit.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Checkout Session
export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan } = req.body;

    if (!['pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Get user email
    const userResult = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );

    // Get or create Stripe customer
    let customerId;
    const subscription = await pool.query(
      'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1',
      [userId]
    );

    if (subscription.rows[0]?.stripe_customer_id) {
      customerId = subscription.rows[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: userResult.rows[0].email,
        metadata: { userId: userId.toString() },
      });
      customerId = customer.id;

      await pool.query(
        'UPDATE subscriptions SET stripe_customer_id = $1 WHERE user_id = $2',
        [customerId, userId]
      );
    }

    // Get price ID from environment
    const priceId = plan === 'pro'
      ? process.env.STRIPE_PRICE_ID_PRO
      : process.env.STRIPE_PRICE_ID_ENTERPRISE;

    if (!priceId) {
      return res.status(500).json({ error: 'Price ID not configured' });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: {
        userId: userId.toString(),
        plan,
      },
    });

    auditLog(userId, 'CHECKOUT_SESSION_CREATED', { plan }, req);

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

// Create Portal Session
export const createPortalSession = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await pool.query(
      'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1',
      [userId]
    );

    if (!subscription.rows[0]?.stripe_customer_id) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.rows[0].stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/settings`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Create portal session error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
};

// Stripe Webhook Handler
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = parseInt(session.metadata.userId);
        const plan = session.metadata.plan;

        await pool.query(
          `UPDATE subscriptions 
           SET plan = $1, status = 'active', stripe_subscription_id = $2, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $3`,
          [plan, session.subscription, userId]
        );

        auditLog(userId, 'SUBSCRIPTION_ACTIVATED', { plan });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const customerId = invoice.customer;

        const result = await pool.query(
          'SELECT user_id FROM subscriptions WHERE stripe_customer_id = $1',
          [customerId]
        );

        if (result.rows.length > 0) {
          const userId = result.rows[0].user_id;
          
          await pool.query(
            `UPDATE subscriptions 
             SET status = 'active',
                 current_period_start = to_timestamp($1),
                 current_period_end = to_timestamp($2),
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $3`,
            [subscription.current_period_start, subscription.current_period_end, userId]
          );

          auditLog(userId, 'PAYMENT_SUCCEEDED', { amount: invoice.amount_paid / 100 });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const result = await pool.query(
          'SELECT user_id FROM subscriptions WHERE stripe_customer_id = $1',
          [customerId]
        );

        if (result.rows.length > 0) {
          const userId = result.rows[0].user_id;
          
          await pool.query(
            'UPDATE subscriptions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
            ['past_due', userId]
          );

          auditLog(userId, 'PAYMENT_FAILED', {});
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const result = await pool.query(
          'SELECT user_id FROM subscriptions WHERE stripe_customer_id = $1',
          [customerId]
        );

        if (result.rows.length > 0) {
          const userId = result.rows[0].user_id;
          
          await pool.query(
            `UPDATE subscriptions 
             SET plan = 'free', status = 'canceled', stripe_subscription_id = NULL, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1`,
            [userId]
          );

          auditLog(userId, 'SUBSCRIPTION_CANCELED', {});
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

export default {
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
};
