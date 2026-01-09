import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import betRoutes from './routes/bets.js';
import marketRoutes from './routes/markets.js';
import usersRouter from './routes/users.js';
import racesRouter from './routes/races.js';

// Import cron service
import './services/cronService.js';

// Import Firebase configuration
import './config/firebase.js';

// Import rate limiting
import { rateLimiters, getRateLimitStats } from './middleware/rateLimit.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Enhanced CORS configuration for Firefox compatibility
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Apply general rate limiting to all API routes
app.use('/api/', rateLimiters.general);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'F1 Predict API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rate limiting status endpoint
app.get('/rate-limit-status', async (req, res) => {
  try {
    const stats = await getRateLimitStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get rate limit status'
    });
  }
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/bets', betRoutes);
app.use('/api/v1/markets', marketRoutes);
app.use('/api/v1/races', racesRouter);

// F1-specific routes for frontend compatibility
app.use('/f1', racesRouter);
app.use('/f1/results', racesRouter);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room for notifications
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Join market room for real-time updates
  socket.on('join-market', (marketId) => {
    socket.join(`market-${marketId}`);
    console.log(`User joined market ${marketId}`);
  });

  // Handle bet placement
  socket.on('bet-placed', (data) => {
    // Broadcast to all users in the market
    io.to(`market-${data.market_id}`).emit('bet-update', {
      type: 'bet-placed',
      data: data
    });
  });

  // Handle market updates
  socket.on('market-update', (data) => {
    io.to(`market-${data.market_id}`).emit('market-update', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Rate limit status: http://localhost:${PORT}/rate-limit-status`);
      console.log(`🔥 Firebase connected: f1-webapp-b2598`);
      
      // Log rate limiting configuration
      console.log(`🛡️  Rate limiting enabled:`);
      console.log(`   - General API: 100 requests per 15 minutes`);
      console.log(`   - Authentication: 5 attempts per 15 minutes`);
      console.log(`   - Forgot Password: 3 requests per hour`);
      console.log(`   - Password Reset: 5 attempts per 15 minutes`);
      console.log(`   - Registration: 3 attempts per hour`);
      console.log(`   - Betting: 30 operations per minute`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, io };
