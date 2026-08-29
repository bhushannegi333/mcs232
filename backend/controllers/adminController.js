// ============================================================
// controllers/adminController.js - Admin Dashboard Logic
// ============================================================

const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');
const { Payment } = require('../models/PaymentReview');

// ─── GET /api/admin/dashboard ─────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers, totalOwners, totalVehicles, totalTours,
      pendingVehicles, totalBookings, monthBookings,
      totalRevenue, monthRevenue, recentBookings, recentUsers
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'owner' }),
      Vehicle.countDocuments({ isApproved: true }),
      Tour.countDocuments({ isApproved: true }),
      Vehicle.countDocuments({ isApproved: false }),
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Payment.aggregate([{ $match: { status: 'captured' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([
        { $match: { status: 'captured', paidAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Booking.find().populate('userId', 'name').populate('vehicleId', 'make model').sort('-createdAt').limit(5),
      User.find().sort('-createdAt').limit(5).select('name email role createdAt')
    ]);

    // Monthly booking trend (last 6 months)
    const bookingTrend = await Booking.aggregate([
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);

    // Top cities
    const topCities = await Vehicle.aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers, totalOwners, totalVehicles, totalTours,
          pendingVehicles, totalBookings, monthBookings,
          totalRevenue: totalRevenue[0]?.total || 0,
          monthRevenue: monthRevenue[0]?.total || 0
        },
        recentBookings,
        recentUsers,
        bookingTrend,
        topCities
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/admin/pending-listings ─────────────────────
const getPendingListings = async (req, res, next) => {
  try {
    const [pendingVehicles, pendingTours] = await Promise.all([
      Vehicle.find({ isApproved: false }).populate('ownerId', 'name email phone').sort('-createdAt'),
      Tour.find({ isApproved: false }).populate('ownerId', 'name email phone').sort('-createdAt')
    ]);
    res.json({ success: true, vehicles: pendingVehicles, tours: pendingTours });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/admin/approve/vehicle/:id ─────────────────
const approveVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    res.json({ success: true, message: 'Vehicle approved successfully.', data: vehicle });
  } catch (err) { next(err); }
};

// ─── POST /api/admin/reject/vehicle/:id ──────────────────
const rejectVehicle = async (req, res, next) => {
  try {
    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Vehicle listing rejected and removed.' });
  } catch (err) { next(err); }
};

// ─── POST /api/admin/approve/tour/:id ────────────────────
const approveTour = async (req, res, next) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!tour) return res.status(404).json({ success: false, message: 'Tour not found.' });
    res.json({ success: true, message: 'Tour approved.', data: tour });
  } catch (err) { next(err); }
};

// ─── GET /api/admin/users ────────────────────────────────
const getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    const total = await User.countDocuments(filter);
    const users = await User.find(filter).sort('-createdAt')
      .skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, total, data: users });
  } catch (err) { next(err); }
};

// ─── PUT /api/admin/users/:id/block ──────────────────────
const toggleUserBlock = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot block admin.' });
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: `User ${user.isActive ? 'unblocked' : 'blocked'} successfully.`, data: user });
  } catch (err) { next(err); }
};

// ─── GET /api/admin/bookings ──────────────────────────────
const getAllBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('userId', 'name email').populate('vehicleId', 'make model').populate('tourId', 'title')
      .sort('-createdAt').skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, total, data: bookings });
  } catch (err) { next(err); }
};

module.exports = { getDashboardStats, getPendingListings, approveVehicle, rejectVehicle, approveTour, getUsers, toggleUserBlock, getAllBookings };
