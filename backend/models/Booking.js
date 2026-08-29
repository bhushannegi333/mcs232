// ============================================================
// models/Booking.js - Booking Schema
// ============================================================

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  // Either vehicleId or tourId must be present
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    index: true
  },
  tourId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    index: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingType: {
    type: String,
    enum: ['vehicle', 'tour'],
    required: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  pickupLocation: {
    type: String,
    required: [true, 'Pickup location is required'],
    trim: true
  },
  dropLocation: {
    type: String,
    trim: true
  },
  passengers: {
    type: Number,
    required: [true, 'Number of passengers is required'],
    min: [1, 'Minimum 1 passenger required']
  },
  // Price Breakdown
  baseAmount: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    required: true,
    default: 0
  },
  serviceCharge: {
    type: Number,
    required: true,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  cancellationReason: String,
  specialRequests: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// ─── Validation: end date must be after start date ───────
bookingSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

// ─── Virtual: number of days ─────────────────────────────
bookingSchema.virtual('numDays').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ ownerId: 1, status: 1 });
bookingSchema.index({ vehicleId: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
