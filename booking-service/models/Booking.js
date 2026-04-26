const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  turf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Turf',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // e.g., 'YYYY-MM-DD'
    required: true
  },
  timeSlot: {
    type: String, // e.g., '10:00-11:00'
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'confirmed'
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
