const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
// Initialize Redis
const redisClient = require('./config/redisClient');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Connect to MongoDB (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Routes
app.use('/api/bookings', require('./routes/bookingRoutes'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Booking Service is running' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5003;
  app.listen(PORT, () => {
    console.log(`Booking Service running on port ${PORT}`);
  });
}

module.exports = app;
