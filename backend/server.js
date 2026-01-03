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

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import tradeRoutes from './routes/tradeRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// Load environment variables
dotenv.config();

// Validate critical environment variables
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ STARTUP FAILED: Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n💡 Action Required:');
  console.error('   1. Set the required environment variable(s) listed above');
  console.error('   2. You can set them in a .env file (copy from .env.example)');
  console.error('   3. Or set them directly in your environment');
  console.error('\n📋 Note: JWT_SECRET is critical for authentication security');
  console.error('   ⚠️  IMPORTANT: Generate a strong random key, minimum 32 characters');
  console.error('   ✅ Good: Use `openssl rand -base64 32` or similar');
  console.error('   ❌ Bad: Simple strings like "secret" or "password123"\n');
  process.exit(1);
}

// Warn about insecure JWT_SECRET in production
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET) {
  const insecureSecrets = ['secret', 'password', 'test', 'example', 'changeme', 'your-super-secret'];
  const secret = process.env.JWT_SECRET.toLowerCase();
  if (insecureSecrets.some(bad => secret.includes(bad))) {
    console.error('❌ SECURITY WARNING: JWT_SECRET appears to be insecure!');
    console.error('   Generate a strong random key using: openssl rand -base64 32');
    process.exit(1);
  }
}

// Warn about optional but recommended variables
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  Warning: DATABASE_URL not set. Database features will be unavailable.');
}

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

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
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database
    console.log('Initializing database...');
    try {
      await initDatabase();
      console.log('✓ Database initialized');
    } catch (dbError) {
      console.warn('⚠️  Database connection failed:', dbError.message);
      console.log('⚠️  Server will start in limited mode without database');
    }

    // Initialize WebSocket
    console.log('Initializing WebSocket...');
    initializeWebSocket(server);
    console.log('✓ WebSocket initialized');

    // Initialize MT5 connections
    console.log('Initializing MT5 connections...');
    try {
      await initializeMT5Connections();
      console.log('✓ MT5 connections initialized');
    } catch (mt5Error) {
      console.warn('⚠️  MT5 initialization failed:', mt5Error.message);
    }

    // Start balance sync scheduler
    try {
      startBalanceSyncScheduler();
      console.log('✓ Balance sync scheduler started');
    } catch (schedError) {
      console.warn('⚠️  Balance sync scheduler failed:', schedError.message);
    }

    // Start server
    server.listen(PORT, () => {
      console.log('\n🚀 AlgoEdge Backend Server');
      console.log('==========================');
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Server running on port: ${PORT}`);
      console.log(`API available at: http://localhost:${PORT}/api`);
      console.log(`WebSocket available at: ws://localhost:${PORT}`);
      console.log('==========================\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\nReceived shutdown signal, closing server gracefully...');
  
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });

  // Removed forced shutdown timeout to keep server running
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

export default app;

