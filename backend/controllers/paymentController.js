// ============================================================
// controllers/paymentController.js - Razorpay Integration
// ============================================================

const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const { Payment } = require('../models/PaymentReview');
const { sendEmail } = require('../services/emailService');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ─── POST /api/payments/create-order ─────────────────────
// Creates a Razorpay order and returns order_id to frontend
const createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Booking is not in pending state.' });
    }

    // Razorpay expects amount in paise (INR × 100)
    const options = {
      amount: Math.round(booking.totalPrice * 100),
      currency: 'INR',
      receipt: `banjare_${bookingId}`,
      notes: {
        bookingId: bookingId.toString(),
        userId: req.user._id.toString()
      }
    };

    const order = await razorpay.orders.create(options);

    // Save payment record as pending
    await Payment.create({
      bookingId,
      userId: req.user._id,
      amount: booking.totalPrice,
      gateway: 'razorpay',
      razorpayOrderId: order.id,
      status: 'pending'
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/payments/verify ────────────────────────────
// Called after Razorpay checkout completes on frontend
// Verifies HMAC-SHA256 signature to prevent fraud
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    // ── Signature Verification ──────────────────────────────
    // Razorpay signature = HMAC-SHA256(order_id + "|" + payment_id, key_secret)
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    // ── Update Payment Record ──────────────────────────────
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'captured',
        paidAt: new Date()
      },
      { new: true }
    );

    // ── Update Booking Status ──────────────────────────────
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: 'confirmed', paymentId: payment._id },
      { new: true }
    ).populate('userId', 'name email').populate('vehicleId', 'make model city');

    // ── Send Confirmation Email ────────────────────────────
    sendEmail({
      to: booking.userId.email,
      subject: '✅ Booking Confirmed - Banjare',
      template: 'bookingConfirmation',
      data: {
        name: booking.userId.name,
        bookingId: booking._id,
        vehicleName: booking.vehicleId ? `${booking.vehicleId.make} ${booking.vehicleId.model}` : 'Tour Package',
        startDate: booking.startDate.toDateString(),
        endDate: booking.endDate.toDateString(),
        totalPrice: booking.totalPrice,
        paymentId: razorpay_payment_id
      }
    }).catch(console.error);

    res.json({
      success: true,
      message: 'Payment verified. Booking confirmed!',
      data: { booking, paymentId: razorpay_payment_id }
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/payments/my ────────────────────────────────
const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate({ path: 'bookingId', populate: { path: 'vehicleId', select: 'make model' } })
      .sort('-createdAt');
    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
};

module.exports = { createOrder, verifyPayment, getMyPayments };
