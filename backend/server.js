import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { initDatabase } from './config/database.js';
import { initializeWebSocket } from './services/websocketService.js';
import { initializeMT5Connections, startBalanceSyncScheduler } from './services/mt5Service.js';
import { auditMiddleware } from './middleware/audit.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import tradeRoutes from './routes/tradeRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET environment variable');
  process.exit(1);
}

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
app.use(compression());

// Body parsing - JSON for most routes
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    // Stripe webhook needs raw body
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));

// Audit logging middleware
app.use(auditMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Root endpoint for basic connectivity check (Render health checks)
app.get('/', (req, res) => {
  res.status(200).send('AlgoEdge Backend API - Running');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/payments', paymentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ error: 'Internal server error' });
});

// Initialize database and start server
const startServer = async () => {
  server.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });

  try {
    await initDatabase();
    initializeWebSocket(server);
    await initializeMT5Connections().catch(() => {});
    startBalanceSyncScheduler();
  } catch (error) {
    console.error('Initialization error:', error.message);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('uncaughtException', (err) => { console.error('Uncaught:', err); process.exit(1); });

startServer();

export default app;
