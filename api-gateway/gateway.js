const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('./utils/logger');
const { globalLimiter, authLimiter, bookingLimiter } = require('./middleware/rateLimiter');

const app = express();

// ── Global Rate Limiter (100 req/min per IP) ──────────────
// Applied to all routes as a baseline DDoS / abuse shield
app.use(globalLimiter);

// Health check for the gateway itself
app.get('/', (req, res) => {
  res.json({ message: 'Turf Booking API Gateway is running' });
});

// Proxy /api/auth/* → auth-service:5001
// Auth limiter: 10 req/min per IP (brute-force protection)
app.use('/api/auth', authLimiter, createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://auth-service:5001',
  changeOrigin: true,
  pathRewrite: (path, req) => `/api/auth${path}`,
}));

// Proxy /api/turfs/* → turf-service:5002
app.use('/api/turfs', createProxyMiddleware({
  target: process.env.TURF_SERVICE_URL || 'http://turf-service:5002',
  changeOrigin: true,
  pathRewrite: (path, req) => `/api/turfs${path}`,
}));

// Proxy /api/bookings/* → booking-service:5003
// Booking limiter: 20 req/min per IP (anti-hoarding)
app.use('/api/bookings', bookingLimiter, createProxyMiddleware({
  target: process.env.BOOKING_SERVICE_URL || 'http://booking-service:5003',
  changeOrigin: true,
  pathRewrite: (path, req) => `/api/bookings${path}`,
}));

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    logger.info(`API Gateway running on port ${PORT}`);
  });
}

module.exports = app;
