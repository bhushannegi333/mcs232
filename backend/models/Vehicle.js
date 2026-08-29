// ============================================================
// models/Vehicle.js - Vehicle Listing Schema
// ============================================================

const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner reference is required'],
    index: true
  },
  make: {
    type: String,
    required: [true, 'Vehicle make is required'],
    trim: true,
    maxlength: [50, 'Make cannot exceed 50 characters']
  },
  model: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true,
    maxlength: [50, 'Model cannot exceed 50 characters']
  },
  year: {
    type: Number,
    required: [true, 'Manufacturing year is required'],
    min: [2000, 'Year must be 2000 or later'],
    max: [new Date().getFullYear() + 1, 'Invalid year']
  },
  vehicleType: {
    type: String,
    enum: ['sedan', 'suv', 'tempo-traveller', 'mini-bus', 'hatchback', 'innova', 'bolero'],
    required: [true, 'Vehicle type is required']
  },
  seats: {
    type: Number,
    required: [true, 'Seating capacity is required'],
    min: [2, 'Minimum 2 seats required'],
    max: [20, 'Maximum 20 seats allowed']
  },
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'cng', 'electric'],
    default: 'diesel'
  },
  pricePerDay: {
    type: Number,
    required: [true, 'Daily price is required'],
    min: [500, 'Minimum price is ₹500 per day']
  },
  city: {
    type: String,
    required: [true, 'Base city is required'],
    trim: true,
    index: true,
    enum: [
      'Dehradun', 'Rishikesh', 'Haridwar', 'Mussoorie', 'Nainital',
      'Kedarnath', 'Badrinath', 'Auli', 'Jim Corbett', 'Chopta',
      'Lansdowne', 'Chakrata', 'Mana', 'Gangotri', 'Yamunotri',
      'Almora', 'Ranikhet', 'Pithoragarh', 'Munsiyari', 'Chaukori'
    ]
  },
  registrationNumber: {
    type: String,
    required: [true, 'Vehicle registration number is required'],
    uppercase: true,
    trim: true
  },
  features: [{
    type: String,
    enum: ['AC', 'Non-AC', 'Music System', 'GPS', 'WiFi', 'USB Charging', 'First Aid Kit', 'Luggage Carrier', 'Push-Back Seats']
  }],
  images: [{
    type: String
  }],
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  isApproved: {
    type: Boolean,
    default: false // Must be approved by admin before appearing in search
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalBookings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// ─── Compound indexes for search performance ─────────────
vehicleSchema.index({ city: 1, isApproved: 1, isAvailable: 1 });
vehicleSchema.index({ vehicleType: 1, pricePerDay: 1 });
vehicleSchema.index({ ownerId: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
