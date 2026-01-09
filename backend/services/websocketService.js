import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

// Initialize Socket.io
export const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Track active position subscriptions
  const positionSubscriptions = new Map();

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to AlgoEdge WebSocket',
      userId: socket.userId,
    });

    // Handle position subscription request
    socket.on('subscribe:positions', (data) => {
      const { accountId } = data;
      if (accountId) {
        console.log(`User ${socket.userId} subscribed to positions for account ${accountId}`);
        socket.accountId = accountId;
        positionSubscriptions.set(socket.userId, accountId);
      }
    });

    // Handle unsubscribe
    socket.on('unsubscribe:positions', () => {
      positionSubscriptions.delete(socket.userId);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      positionSubscriptions.delete(socket.userId);
    });

    // Handle manual ping/pong for connection testing
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });

  console.log('WebSocket server initialized');
  return io;
};

// Emit trade update to specific user
export const emitTradeUpdate = (userId, trade) => {
  if (io) {
    io.to(`user:${userId}`).emit('trade:update', trade);
  }
};

// Emit new trade to specific user
export const emitNewTrade = (userId, trade) => {
  if (io) {
    io.to(`user:${userId}`).emit('trade:new', trade);
  }
};

// Emit trade closed to specific user
export const emitTradeClosed = (userId, trade) => {
  if (io) {
    io.to(`user:${userId}`).emit('trade:closed', trade);
  }
};

// Emit price update to all connected clients
export const emitPriceUpdate = (symbol, price) => {
  if (io) {
    io.emit('price:update', { symbol, price, timestamp: Date.now() });
  }
};

// Emit position updates with real-time prices to specific user
export const emitPositionUpdate = (userId, positions) => {
  if (io) {
    io.to(`user:${userId}`).emit('positions:update', { 
      positions, 
      timestamp: Date.now() 
    });
  }
};

// Emit MT5 connection status to specific user
export const emitMT5Status = (userId, accountId, status) => {
  if (io) {
    io.to(`user:${userId}`).emit('mt5:status', { accountId, status });
  }
};

// Emit balance update to specific user
export const emitBalanceUpdate = (userId, balance) => {
  if (io) {
    io.to(`user:${userId}`).emit('balance:update', balance);
  }
};

// Emit robot status change to specific user
export const emitRobotStatus = (userId, robotId, status) => {
  if (io) {
    io.to(`user:${userId}`).emit('robot:status', { robotId, status });
  }
};

// Emit notification to specific user
export const emitNotification = (userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
};

// Emit trade signal to specific user
export const emitTradeSignal = (userId, signal) => {
  if (io) {
    io.to(`user:${userId}`).emit('trade:signal', signal);
    console.log(`📡 Trade signal emitted to user ${userId}:`, signal.signal?.symbol);
  }
};

// Get Socket.io instance
export const getIO = () => io;

export default {
  initializeWebSocket,
  emitTradeUpdate,
  emitNewTrade,
  emitTradeClosed,
  emitPriceUpdate,
  emitPositionUpdate,
  emitMT5Status,
  emitBalanceUpdate,
  emitRobotStatus,
  emitNotification,
  emitTradeSignal,
  getIO,
};
