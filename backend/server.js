import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { initDatabase } from './config/database.js';
import { initializeWebSocket } from './services/websocketService.js';
import {
  initializeMT5Connections,
  startBalanceSyncScheduler,
} from './services/mt5Service.js';
import { startTradingScheduler, stopTradingScheduler } from './services/tradingScheduler.js';
import { startReportSchedulers, stopReportSchedulers } from './services/reportScheduler.js';

import { auditMiddleware } from './middleware/audit.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import tradeRoutes from './routes/tradeRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import mt5Routes from './routes/mt5Routes.js';
import telegramRoutes from './routes/telegramRoutes.js';
import whopRoutes from './routes/whopRoutes.js';
import affiliateRoutes from './routes/affiliateRoutes.js';
import adminAffiliateRoutes from './routes/adminAffiliateRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';
import adminMarketplaceRoutes from './routes/adminMarketplaceRoutes.js';
import signalRoutes from './routes/signalRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import adminWalletRoutes from './routes/adminWalletRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import changelogRoutes from './routes/changelogRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

/* -------------------------------------------------------------------------- */
/*                              ENV & CONSTANTS                               */
/* -------------------------------------------------------------------------- */

dotenv.config({ quiet: true });

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

if (!process.env.JWT_SECRET) {
  console.error('❌ Missing JWT_SECRET environment variable');
  process.exit(1);
}

/* -------------------------------------------------------------------------- */
/*                               APP SETUP                                    */
/* -------------------------------------------------------------------------- */

const app = express();

// Trust proxy for Railway/Heroku/etc (needed for rate limiting and X-Forwarded-For)
app.set('trust proxy', 1);

const server = http.createServer(app);

/* -------------------------------------------------------------------------- */
/*                              MIDDLEWARES                                   */
/* -------------------------------------------------------------------------- */

const setupSecurityMiddleware = (app) => {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    })
  );

  app.use(
    cors({
      origin: [
        FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'https://algoedgehub.com',
        'https://www.algoedgehub.com',
        'https://algoedgehub-eight.vercel.app',
        /\.vercel\.app$/,
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(compression());
};

const setupBodyParsers = (app) => {
  app.use((req, res, next) => {
    if (req.originalUrl === '/api/payments/webhook') {
      return next(); // raw body required
    }
    express.json({ limit: '10mb' })(req, res, next);
  });

  app.use(express.urlencoded({ extended: true }));
};

const setupRoutes = (app) => {
  app.get('/', (_, res) => {
    res.status(200).send('AlgoEdge Backend API - Running');
  });

  app.get('/health', (_, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Serve product files statically (files are protected by download route auth)
  app.use('/products', express.static(path.join(__dirname, 'products')));
  
  // Serve uploaded files (profile images, etc.)
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/trades', tradeRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/mt5', mt5Routes);
  app.use('/api/telegram', telegramRoutes);
  app.use('/api/whop', whopRoutes);
  app.use('/api/affiliate', affiliateRoutes);
  app.use('/api/admin/affiliate', adminAffiliateRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/marketplace', marketplaceRoutes);
  app.use('/api/admin/marketplace', adminMarketplaceRoutes);
  app.use('/api/signals', signalRoutes);
  app.use('/api/seller', sellerRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/verification', verificationRoutes);
  app.use('/api/admin/wallet', adminWalletRoutes);
  app.use('/api/admin/users', adminUserRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/alerts', alertRoutes);
  app.use('/api/changelog', changelogRoutes);
  app.use('/api/feedback', feedbackRoutes);
  app.use('/api/journal', journalRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/reviews', reviewRoutes);
  console.log('✅ All routes registered');
};

const setupErrorHandlers = (app) => {
  app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
    });
  });
};

/* -------------------------------------------------------------------------- */
/*                            APPLICATION INIT                                 */
/* -------------------------------------------------------------------------- */

const startServer = async () => {
  try {
    setupSecurityMiddleware(app);
    setupBodyParsers(app);

    app.use(auditMiddleware);

    setupRoutes(app);
    setupErrorHandlers(app);

    // Initialize database and run migrations
    try {
      await initDatabase();
    } catch (dbError) {
      console.log('ℹ️ Database init note:', dbError.message);
    }

    initializeWebSocket(server);

    try {
      await initializeMT5Connections();
    } catch {
      // MT5 optional failure should not kill server
    }

    startBalanceSyncScheduler();

    // Start automated trading scheduler
    await startTradingScheduler();
    console.log('✅ Trading scheduler started - robots will trade automatically');

    // Start email report schedulers (daily + weekly)
    startReportSchedulers();
    console.log('✅ Report schedulers started - emails will be sent on schedule');

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('🔥 Startup failure:', error);
    process.exit(1);
  }
};

/* -------------------------------------------------------------------------- */
/*                           GRACEFUL SHUTDOWN                                 */
/* -------------------------------------------------------------------------- */

const shutdown = () => {
  console.log('🛑 Shutting down server...');
  stopTradingScheduler();
  stopReportSchedulers();
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

/* -------------------------------------------------------------------------- */
/*                                START                                        */
/* -------------------------------------------------------------------------- */

startServer();

export default app;
