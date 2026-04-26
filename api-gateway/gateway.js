const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Health check for the gateway itself
app.get('/', (req, res) => {
  res.json({ message: 'Turf Booking API Gateway is running' });
});

// Proxy /api/auth/* → auth-service:5001
app.use('/api/auth', createProxyMiddleware({
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
app.use('/api/bookings', createProxyMiddleware({
  target: process.env.BOOKING_SERVICE_URL || 'http://booking-service:5003',
  changeOrigin: true,
  pathRewrite: (path, req) => `/api/bookings${path}`,
}));

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
  });
}

module.exports = app;
