const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config(); // Must be called before passport

const session = require('express-session');
const connectDB = require('./config/db');
const passport = require('./config/passport');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Session (required by Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Auth Service is running' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Auth Service running on port ${PORT}`);
  });
}

module.exports = app;
