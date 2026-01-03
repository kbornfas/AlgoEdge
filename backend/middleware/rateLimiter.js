import rateLimit from 'express-rate-limit';

// Skip rate limiting in test environment
const isTestEnv = process.env.NODE_ENV === 'test';

// General API rate limiter
export const apiLimiter = isTestEnv
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });

// Strict rate limiter for auth endpoints
export const authLimiter = isTestEnv
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 requests per window
      message: 'Too many authentication attempts, please try again later.',
      skipSuccessfulRequests: true,
    });

// Rate limiter for trade operations
export const tradeLimiter = isTestEnv
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 30, // 30 requests per minute
      message: 'Too many trade operations, please slow down.',
    });
