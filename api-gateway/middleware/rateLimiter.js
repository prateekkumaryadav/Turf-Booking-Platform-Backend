const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────
// Redis store (optional) — activated when REDIS_URL is set
// Falls back to in-memory store for local / single-instance use
// ─────────────────────────────────────────────────────────────
let store;

if (process.env.REDIS_URL) {
  try {
    const { RedisStore } = require('rate-limit-redis');
    const Redis = require('ioredis');

    const redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    redisClient.on('error', (err) => {
      logger.warn(`Rate-limiter Redis error (falling back to memory): ${err.message}`);
    });

    store = new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'rl:',
    });

    logger.info('Rate limiter: using Redis store');
  } catch (err) {
    logger.warn(`Rate limiter: Redis setup failed, using memory store — ${err.message}`);
    store = undefined; // falls back to built-in MemoryStore
  }
} else {
  logger.info('Rate limiter: using in-memory store (set REDIS_URL for distributed limiting)');
}

// ─────────────────────────────────────────────────────────────
// Shared options
// ─────────────────────────────────────────────────────────────
const standardHeaders = true;   // Return rate limit info in `RateLimit-*` headers
const legacyHeaders = false;    // Disable `X-RateLimit-*` headers

// ─────────────────────────────────────────────────────────────
// 1. Global rate limiter — 100 requests per minute per IP
//    Applied to all routes as a baseline protection
// ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,             // 1 minute
  limit: parseInt(process.env.RATE_LIMIT_GLOBAL || '100', 10),
  standardHeaders,
  legacyHeaders,
  ...(store && { store }),
  message: {
    status: 429,
    message: 'Too many requests. Please try again later.',
  },
  handler: (req, res, next, options) => {
    logger.warn(`Global rate limit exceeded — IP: ${req.ip}, Path: ${req.originalUrl}`);
    res.status(options.statusCode).json(options.message);
  },
  skip: (req) => req.path === '/' || req.path === '/healthz', // Don't limit health checks
});

// ─────────────────────────────────────────────────────────────
// 2. Auth rate limiter — 10 requests per minute per IP
//    Strict limit on login/register to prevent brute-force
// ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 60 * 1000,             // 1 minute
  limit: parseInt(process.env.RATE_LIMIT_AUTH || '10', 10),
  standardHeaders,
  legacyHeaders,
  ...(store && { store }),
  keyGenerator: (req) => `auth:${ipKeyGenerator(req)}`,  // separate bucket from global
  message: {
    status: 429,
    message: 'Too many authentication attempts. Please wait a minute before trying again.',
  },
  handler: (req, res, next, options) => {
    logger.warn(`Auth rate limit exceeded — IP: ${req.ip}, Path: ${req.originalUrl}`);
    res.status(options.statusCode).json(options.message);
  },
});

// ─────────────────────────────────────────────────────────────
// 3. Booking rate limiter — 20 requests per minute per IP
//    Prevents slot-hoarding and automated booking scripts
// ─────────────────────────────────────────────────────────────
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,             // 1 minute
  limit: parseInt(process.env.RATE_LIMIT_BOOKING || '20', 10),
  standardHeaders,
  legacyHeaders,
  ...(store && { store }),
  keyGenerator: (req) => `booking:${ipKeyGenerator(req)}`,
  message: {
    status: 429,
    message: 'Too many booking requests. Please slow down.',
  },
  handler: (req, res, next, options) => {
    logger.warn(`Booking rate limit exceeded — IP: ${req.ip}, Path: ${req.originalUrl}`);
    res.status(options.statusCode).json(options.message);
  },
});

module.exports = { globalLimiter, authLimiter, bookingLimiter };
