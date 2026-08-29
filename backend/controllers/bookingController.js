// ============================================================
// controllers/bookingController.js - Booking Business Logic
// ============================================================

const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Tour = require('../models/Tour');
const { sendEmail } = require('../services/emailService');

// ─── Price Calculation Helper ─────────────────────────────
const calculatePrice = (pricePerDay, startDate, endDate, passengers = 1, bookingType = 'vehicle') => {
  const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
  const baseAmount = bookingType === 'tour'
    ? pricePerDay * passengers          // Tour: price per person
    : pricePerDay * days;               // Vehicle: price per day
  const taxAmount = Math.round(baseAmount * 0.18);     // 18% GST
  const serviceCharge = Math.round(baseAmount * 0.05); // 5% platform fee
  const totalPrice = baseAmount + taxAmount + serviceCharge;
  return { days, baseAmount, taxAmount, serviceCharge, totalPrice };
};

// ─── POST /api/bookings ───────────────────────────────────
const createBooking = async (req, res, next) => {
  try {
    const { vehicleId, tourId, startDate, endDate, pickupLocation, dropLocation, passengers, specialRequests } = req.body;

    let bookingItem, ownerId, pricePerUnit, bookingType;

    if (vehicleId) {
      bookingItem = await Vehicle.findById(vehicleId);
      if (!bookingItem || !bookingItem.isApproved) {
        return res.status(404).json({ success: false, message: 'Vehicle not found or not available.' });
      }
      // Check date availability: no overlapping confirmed bookings
      const conflict = await Booking.findOne({
        vehicleId,
        status: { $in: ['pending', 'confirmed'] },
        $or: [
          { startDate: { $lt: new Date(endDate) }, endDate: { $gt: new Date(startDate) } }
        ]
      });
      if (conflict) {
        return res.status(409).json({ success: false, message: 'Vehicle is not available for the selected dates.' });
      }
      ownerId = bookingItem.ownerId;
      pricePerUnit = bookingItem.pricePerDay;
      bookingType = 'vehicle';
    } else if (tourId) {
      bookingItem = await Tour.findById(tourId);
      if (!bookingItem || !bookingItem.isApproved) {
        return res.status(404).json({ success: false, message: 'Tour not found or not available.' });
      }
      ownerId = bookingItem.ownerId;
      pricePerUnit = bookingItem.price;
      bookingType = 'tour';
    } else {
      return res.status(400).json({ success: false, message: 'vehicleId or tourId is required.' });
    }

    const { days, baseAmount, taxAmount, serviceCharge, totalPrice } = calculatePrice(
      pricePerUnit, startDate, endDate, parseInt(passengers), bookingType
    );

    const booking = await Booking.create({
      userId: req.user._id,
      vehicleId: vehicleId || undefined,
      tourId: tourId || undefined,
      ownerId,
      bookingType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      pickupLocation,
      dropLocation,
      passengers: parseInt(passengers),
      baseAmount,
      taxAmount,
      serviceCharge,
      totalPrice,
      specialRequests,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Booking created. Proceed to payment.',
      data: booking,
      priceBreakdown: { days, baseAmount, taxAmount, serviceCharge, totalPrice }
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/bookings - User's own bookings ──────────────
const getMyBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('vehicleId', 'make model images city pricePerDay')
      .populate('tourId', 'title images price durationDays')
      .sort('-createdAt')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ success: true, total, data: bookings });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/bookings/:id ────────────────────────────────
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('vehicleId', 'make model images city pricePerDay registrationNumber')
      .populate('tourId', 'title images price durationDays destinations')
      .populate('userId', 'name email phone')
      .populate('ownerId', 'name phone')
      .populate('paymentId');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Only the booking user, the owner, or admin can view
    const isAuthorized =
      booking.userId._id.toString() === req.user._id.toString() ||
      booking.ownerId._id.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/bookings/:id/cancel ─────────────────────────
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${booking.status} booking.` });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = req.body.reason || 'Cancelled by user';
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled successfully.', data: booking });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/bookings/owner - Owner's incoming bookings ──
const getOwnerBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { ownerId: req.user._id };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('userId', 'name email phone')
      .populate('vehicleId', 'make model')
      .populate('tourId', 'title')
      .sort('-createdAt');

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/bookings/calculate-price - Price preview ────
const calculateBookingPrice = async (req, res, next) => {
  try {
    const { vehicleId, tourId, startDate, endDate, passengers = 1 } = req.query;
    let pricePerUnit, bookingType;

    if (vehicleId) {
      const v = await Vehicle.findById(vehicleId).select('pricePerDay');
      if (!v) return res.status(404).json({ success: false, message: 'Vehicle not found.' });
      pricePerUnit = v.pricePerDay;
      bookingType = 'vehicle';
    } else if (tourId) {
      const t = await Tour.findById(tourId).select('price');
      if (!t) return res.status(404).json({ success: false, message: 'Tour not found.' });
      pricePerUnit = t.price;
      bookingType = 'tour';
    } else {
      return res.status(400).json({ success: false, message: 'vehicleId or tourId required.' });
    }

    const breakdown = calculatePrice(pricePerUnit, startDate, endDate, parseInt(passengers), bookingType);
    res.json({ success: true, ...breakdown });
  } catch (err) {
    next(err);
  }
};

module.exports = { createBooking, getMyBookings, getBookingById, cancelBooking, getOwnerBookings, calculateBookingPrice };
