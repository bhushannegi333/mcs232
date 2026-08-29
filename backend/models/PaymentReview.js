// ============================================================
// models/Payment.js - Payment Transaction Schema
// ============================================================

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  gateway: {
    type: String,
    enum: ['razorpay', 'cash', 'upi'],
    default: 'razorpay'
  },
  // Razorpay fields
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  // Status
  status: {
    type: String,
    enum: ['pending', 'captured', 'failed', 'refunded'],
    default: 'pending'
  },
  refundId: String,
  refundAmount: Number,
  refundStatus: String,
  paidAt: Date,
  notes: String
}, {
  timestamps: true
});

paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ razorpayOrderId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

// ============================================================
// models/Review.js - Review & Rating Schema
// ============================================================

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  tourId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour'
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  isApproved: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// ─── Update vehicle/tour average rating after review ─────
reviewSchema.post('save', async function() {
  try {
    if (this.vehicleId) {
      const Vehicle = mongoose.model('Vehicle');
      const stats = await mongoose.model('Review').aggregate([
        { $match: { vehicleId: this.vehicleId } },
        { $group: { _id: '$vehicleId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]);
      if (stats.length > 0) {
        await Vehicle.findByIdAndUpdate(this.vehicleId, {
          rating: Math.round(stats[0].avgRating * 10) / 10,
          totalRatings: stats[0].count
        });
      }
    }
  } catch (err) {
    console.error('Error updating rating:', err);
  }
});

reviewSchema.index({ vehicleId: 1 });
reviewSchema.index({ userId: 1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = { Payment, Review };
