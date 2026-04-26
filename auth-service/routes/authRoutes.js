const express = require('express');
const router = express.Router();
const passport = require('passport');
const { register, login, getMe, googleCallback } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me (protected)
router.get('/me', auth, getMe);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback
);

module.exports = router;
