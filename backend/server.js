import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

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

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/trades', tradeRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/mt5', mt5Routes);
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

    // await initDatabase();

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
