const Booking = require('../models/Booking');
const Turf = require('../models/Turf');
const User = require('../models/User');
const redisClient = require('../config/redisClient');

// POST /api/bookings (Create a booking)
const createBooking = async (req, res) => {
  try {
    const { turfId, date, timeSlot } = req.body;

    if (!turfId || !date || !timeSlot) {
      return res.status(400).json({ message: 'Missing booking details' });
    }

    const lockKey = `booking_lock:${turfId}:${date}:${timeSlot}`;
    
    // Acquire distributed lock for 30 seconds using Redis
    // To prevent concurrent bookings for the exact same slot
    const acquiredLock = await redisClient.set(lockKey, 'locked', {
      NX: true,
      EX: 30 
    });

    if (!acquiredLock) {
      return res.status(429).json({ message: 'Too many requests. Someone else is currently booking this slot.' });
    }

    try {
      // Check if turf exists
      const turf = await Turf.findById(turfId);
      if (!turf) {
        throw new Error('Turf not found');
      }

      // Prevent duplicate booking
      const existingBooking = await Booking.findOne({
        turf: turfId,
        date,
        timeSlot,
        status: { $ne: 'cancelled' }
      });

      if (existingBooking) {
        throw new Error('This slot is already booked for the selected date');
      }

      // Create the booking
      const booking = await Booking.create({
        turf: turfId,
        user: req.user.id,
        date,
        timeSlot,
        totalPrice: turf.pricePerHour // Or calculate duration if extending features
      });

      // Add to redis cache to quickly reject subsequent reads
      await redisClient.sAdd(`booked_slots:${turfId}:${date}`, timeSlot);

      res.status(201).json(booking);
    } catch(err) {
      // If error occurs inside the lock, we should clean up if necessary
      if (err.message === 'Turf not found') {
        return res.status(404).json({ message: err.message });
      }
      if (err.message === 'This slot is already booked for the selected date') {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    } finally {
      // Release lock for the next request regardless of success or failure
      await redisClient.del(lockKey);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/bookings/me (Get bookings for logged-in user)
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate('turf', 'name location images');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/bookings/turf/:turfId (Get bookings for a specific turf to disable booked slots on frontend)
const getTurfBookings = async (req, res) => {
  try {
    const { date } = req.query; // Front-end must pass an actual date query
    const { turfId } = req.params;
    
    // Attempt cache read
    if (date) {
      const cachedSlots = await redisClient.sMembers(`booked_slots:${turfId}:${date}`);
      
      if (cachedSlots && cachedSlots.length > 0) {
        // Build mock booking array for frontend compat
        const mockBookings = cachedSlots.map(timeSlot => ({ date, timeSlot }));
        return res.json(mockBookings);
      }
    }
    
    // Only return date and timeSlot to keep user data private
    const query = { turf: turfId, status: { $ne: 'cancelled' }};
    if(date) query.date = date; // Optimize specific day

    const bookings = await Booking.find(query).select('date timeSlot');

    // Populate cache on cache miss
    if (date && bookings.length > 0) {
      const slotValues = bookings.map(b => b.timeSlot);
      await redisClient.sAdd(`booked_slots:${turfId}:${date}`, slotValues);
      await redisClient.expire(`booked_slots:${turfId}:${date}`, 3600); // 1-hour cache
    }

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/bookings/owner (Get all bookings for turfs owned by logged-in owner)
const getOwnerBookings = async (req, res) => {
  try {
    const ownerTurfs = await Turf.find({ owner: req.user.id }).select('_id');
    const turfIds = ownerTurfs.map(t => t._id);

    const bookings = await Booking.find({ turf: { $in: turfIds } })
      .populate('turf', 'name location')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/bookings/:id/cancel (Cancel a booking)
const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    const booking = await Booking.findById(bookingId).populate('turf');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    // Authorization check: Is the user the one who booked it OR the owner of the turf?
    const isBooker = booking.user.toString() === userId;
    const isTurfOwner = booking.turf && booking.turf.owner.toString() === userId;

    if (!isBooker && !isTurfOwner) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Remove the cancelled slot from Redis cache
    await redisClient.sRem(`booked_slots:${booking.turf._id}:${booking.date}`, booking.timeSlot);

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getTurfBookings,
  getOwnerBookings,
  cancelBooking
};
