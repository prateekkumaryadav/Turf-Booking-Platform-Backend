const mongoose = require('mongoose');

// Read-only User schema for booking-service
// This service needs to look up user details (name, email) when populating booking results.
// Both services share the same MongoDB instance.
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'owner'],
    default: 'user'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
