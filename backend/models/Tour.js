// ============================================================
// models/Tour.js - Tour Package Schema
// ============================================================

const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Tour title is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 2000
  },
  price: {
    type: Number,
    required: [true, 'Price per person is required'],
    min: 500
  },
  durationDays: {
    type: Number,
    required: [true, 'Duration is required'],
    min: 1
  },
  itinerary: {
    type: String,
    required: [true, 'Itinerary is required']
  },
  destinations: [{
    type: String,
    trim: true
  }],
  startCity: {
    type: String,
    required: [true, 'Start city is required'],
    enum: [
      'Dehradun', 'Rishikesh', 'Haridwar', 'Mussoorie', 'Nainital',
      'Kedarnath', 'Badrinath', 'Auli', 'Jim Corbett', 'Chopta',
      'Lansdowne', 'Chakrata', 'Almora', 'Ranikhet', 'Pithoragarh'
    ]
  },
  tourType: {
    type: String,
    enum: ['pilgrimage', 'adventure', 'wildlife', 'cultural', 'wellness', 'trekking'],
    required: true
  },
  images: [{ type: String }],
  includes: [{ type: String }], // What's included: Vehicle, Hotel, Guide, etc.
  excludes: [{ type: String }],
  maxGroupSize: {
    type: Number,
    default: 15
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'challenging'],
    default: 'easy'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalBookings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

tourSchema.index({ startCity: 1, isApproved: 1 });
tourSchema.index({ tourType: 1 });

module.exports = mongoose.model('Tour', tourSchema);
