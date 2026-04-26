const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

// Connect directly using MONGO_URI
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Define schemas inline (seed script doesn't need the full service code)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, minlength: 6 },
  googleId: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ['user', 'owner'], default: 'user' }
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

const turfSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  pricePerHour: { type: Number, required: true, min: 0 },
  description: { type: String, required: true },
  availableSlots: [{ type: String }],
  images: [{ type: String }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Turf = mongoose.model('Turf', turfSchema);

const seedDB = async () => {
  await connectDB();

  try {
    let owner = await User.findOne({ email: 'owner@turfbook.com' });
    if (!owner) {
      owner = await User.create({
        name: 'Default Owner',
        email: 'owner@turfbook.com',
        password: 'password123',
        role: 'owner'
      });
      console.log('Created default owner: owner@turfbook.com / password123');
    } else {
      console.log('Owner already exists: owner@turfbook.com / password123');
    }

    // Create a default customer too
    let customer = await User.findOne({ email: 'player@turfbook.com' });
    if (!customer) {
      customer = await User.create({
        name: 'Test Player',
        email: 'player@turfbook.com',
        password: 'password123',
        role: 'user'
      });
      console.log('Created default player: player@turfbook.com / password123');
    } else {
      console.log('Player already exists: player@turfbook.com / password123');
    }

    await Turf.deleteMany({});

    await Turf.create([
      {
        name: 'Green Valley Arena',
        location: 'Downtown City Center',
        pricePerHour: 800,
        description: 'A premium 7v7 turf with high-quality 50mm artificial grass, floodlights, and a sitting area.',
        availableSlots: ['06:00-07:00', '07:00-08:00', '08:00-09:00', '09:00-10:00', '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00', '20:00-21:00'],
        owner: owner._id
      },
      {
        name: 'The Dugout',
        location: 'Westside Sports Complex',
        pricePerHour: 1200,
        description: 'Professional grade 9v9 football turf with shower facilities, energy drinks corner, and ample parking.',
        availableSlots: ['07:00-08:00', '08:00-09:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00', '17:00-18:00', '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00'],
        owner: owner._id
      },
      {
        name: 'Powerplay Box Cricket',
        location: 'North Avenue Mall Roof',
        pricePerHour: 600,
        description: 'Perfect for box cricket. Fully covered from the top, providing excellent shade and wind protection.',
        availableSlots: ['09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'],
        owner: owner._id
      },
      {
        name: 'Elite Sports Hub',
        location: 'East End Tech Park',
        pricePerHour: 1500,
        description: 'FIFA standard turf suitable for corporate events and professional training sessions.',
        availableSlots: ['06:00-07:00', '07:00-08:00', '08:00-09:00', '17:00-18:00', '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00'],
        owner: owner._id
      }
    ]);

    console.log('\n--- Database Seeded Successfully ---');
    console.log('\nTest Accounts:');
    console.log('  Owner:    owner@turfbook.com  / password123');
    console.log('  Customer: player@turfbook.com / password123');
    console.log('\n4 Turfs created with available time slots.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
