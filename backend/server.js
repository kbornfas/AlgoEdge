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

// ============================================================================
// SERVER IDENTIFICATION
// ============================================================================
console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                                                                ║');
console.log('║                    🚀 BACKEND SERVER (Express)                 ║');
console.log('║                       AlgoEdge Trading API                     ║');
console.log('║                                                                ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');
console.log('📍 This is the BACKEND server providing REST API and WebSocket services');
console.log('📍 NOT the frontend Next.js server (see root /server.js for frontend)');
console.log('');

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
  console.warn('   For production deployment, ensure DATABASE_URL is configured.');
  console.warn('');
}

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Always bind to 0.0.0.0 for Render/cloud deployments

// Log critical startup configuration
console.log('\n📋 Server Configuration');
console.log('========================');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Port: ${PORT} (from ${process.env.PORT ? 'process.env.PORT' : 'default'})`);
console.log(`Host: ${HOST}`);
console.log(`Database: ${process.env.DATABASE_URL ? '✓ Configured' : '⚠️  Not configured'}`);
console.log(`JWT Secret: ${process.env.JWT_SECRET ? '✓ Configured' : '❌ Missing'}`);
console.log('========================\n');

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
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  STARTING BACKEND SERVER');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  
  // START SERVER FIRST - Render health checks require open HTTP port immediately
  // This is critical for cloud deployments (Render, Railway, etc.)
  // The platform health checks need to connect to an open port to verify deployment
  console.log('Step 1/5: Opening HTTP port for health checks...');
  server.listen(PORT, HOST, () => {
    console.log('\n✅ HTTP Server Started Successfully');
    console.log('==================================');
    console.log(`✓ Server: BACKEND (Express API)`);
    console.log(`✓ Listening on: ${HOST}:${PORT}`);
    console.log(`✓ API available at: http://${HOST}:${PORT}/api`);
    console.log(`✓ Health check: http://${HOST}:${PORT}/health`);
    console.log(`✓ WebSocket available at: ws://${HOST}:${PORT}`);
    console.log('==================================\n');
    console.log('ℹ️  HTTP port is now open for Render health checks');
    console.log('');
  });

  try {
    // Initialize database
    console.log('Step 2/5: Initializing database connection...');
    try {
      await initDatabase();
      console.log('✅ Database initialized successfully');
    } catch (dbError) {
      console.error('');
      console.error('❌ Database initialization failed:');
      console.error('   Error:', dbError.message);
      console.error('');
      console.error('⚠️  Server will continue in LIMITED MODE without database');
      console.error('   Some features will be unavailable:');
      console.error('   - User authentication and registration');
      console.error('   - Trade history and management');
      console.error('   - Account settings');
      console.error('');
      console.error('💡 To fix this issue:');
      console.error('   1. Verify DATABASE_URL is correctly set');
      console.error('   2. Check database is accessible');
      console.error('   3. Run: npx prisma migrate deploy');
      console.error('   4. Run: node scripts/check-migrations.js');
      console.error('');
    }

    // Initialize WebSocket
    console.log('');
    console.log('Step 3/5: Initializing WebSocket...');
    initializeWebSocket(server);
    console.log('✅ WebSocket initialized successfully');

    // Initialize MT5 connections
    console.log('');
    console.log('Step 4/5: Initializing MT5 connections...');
    try {
      await initializeMT5Connections();
      console.log('✅ MT5 connections initialized successfully');
    } catch (mt5Error) {
      console.warn('⚠️  MT5 initialization failed:', mt5Error.message);
      console.warn('   Trading features will be limited without MT5 connection');
    }

    // Start balance sync scheduler
    console.log('');
    console.log('Step 5/5: Starting balance sync scheduler...');
    try {
      startBalanceSyncScheduler();
      console.log('✅ Balance sync scheduler started successfully');
    } catch (schedError) {
      console.warn('⚠️  Balance sync scheduler failed:', schedError.message);
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ BACKEND SERVER READY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
  } catch (error) {
    console.error('❌ Initialization error:', error);
    console.error('⚠️  Server is running but some services may be unavailable:');
    console.error('   - Check DATABASE_URL if database features are needed');
    console.error('   - Check SMTP settings if email features are needed');
    console.error('   - Check MetaAPI settings if MT5 trading is needed');
    // Don't exit - server is already running and can handle basic requests
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

