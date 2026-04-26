const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');

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
app.use('/api/turfs', require('./routes/turfRoutes'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Turf Service is running' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5002;
  app.listen(PORT, () => {
    console.log(`Turf Service running on port ${PORT}`);
  });
}

module.exports = app;
