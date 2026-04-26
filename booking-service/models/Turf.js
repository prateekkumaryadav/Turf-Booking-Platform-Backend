const mongoose = require('mongoose');

// Read-only Turf schema for booking-service
// This service needs to look up turf details (price, owner) when creating bookings
// and populating booking results. Both services share the same MongoDB instance.
const turfSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  pricePerHour: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  availableSlots: [{
    type: String
  }],
  images: [{
    type: String
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Turf', turfSchema);
