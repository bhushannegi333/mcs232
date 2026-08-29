// ============================================================
// routes/tours.js
// ============================================================
const express = require('express');
const router = express.Router();
const Tour = require('../models/Tour');
const { protect, authorize } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
  try {
    const { tourType, startCity, page = 1, limit = 12 } = req.query;
    const filter = { isApproved: true, isActive: true };
    if (tourType) filter.tourType = tourType;
    if (startCity) filter.startCity = startCity;
    const total = await Tour.countDocuments(filter);
    const tours = await Tour.find(filter)
      .populate('ownerId', 'name phone').sort('-createdAt')
      .skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, total, data: tours });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id).populate('ownerId', 'name phone avatar');
    if (!tour) return res.status(404).json({ success: false, message: 'Tour not found.' });
    res.json({ success: true, data: tour });
  } catch (err) { next(err); }
});

router.post('/', protect, authorize('owner', 'admin'), async (req, res, next) => {
  try {
    const tour = await Tour.create({ ...req.body, ownerId: req.user._id, isApproved: false });
    res.status(201).json({ success: true, message: 'Tour submitted for approval.', data: tour });
  } catch (err) { next(err); }
});

router.put('/:id', protect, authorize('owner', 'admin'), async (req, res, next) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, { ...req.body, isApproved: false }, { new: true });
    res.json({ success: true, data: tour });
  } catch (err) { next(err); }
});

module.exports = router;


// ============================================================
// routes/bookings.js - Save to separate file in actual use
// ============================================================
const bookingRouter = express.Router();
const { createBooking, getMyBookings, getBookingById, cancelBooking, getOwnerBookings, calculateBookingPrice } = require('../controllers/bookingController');

bookingRouter.post('/', protect, createBooking);
bookingRouter.get('/', protect, getMyBookings);
bookingRouter.get('/owner', protect, authorize('owner', 'admin'), getOwnerBookings);
bookingRouter.get('/calculate-price', calculateBookingPrice);
bookingRouter.get('/:id', protect, getBookingById);
bookingRouter.put('/:id/cancel', protect, cancelBooking);


// ============================================================
// routes/payments.js - Save to separate file in actual use
// ============================================================
const paymentRouter = express.Router();
const { createOrder, verifyPayment, getMyPayments } = require('../controllers/paymentController');

paymentRouter.post('/create-order', protect, createOrder);
paymentRouter.post('/verify', protect, verifyPayment);
paymentRouter.get('/my', protect, getMyPayments);


// ============================================================
// routes/reviews.js - Save to separate file in actual use
// ============================================================
const reviewRouter = express.Router();
const { Review } = require('../models/PaymentReview');

reviewRouter.post('/', protect, async (req, res, next) => {
  try {
    const { vehicleId, tourId, bookingId, rating, comment } = req.body;
    const existing = await Review.findOne({ userId: req.user._id, bookingId });
    if (existing) return res.status(400).json({ success: false, message: 'You already reviewed this booking.' });
    const review = await Review.create({ userId: req.user._id, vehicleId, tourId, bookingId, rating, comment });
    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
});

reviewRouter.get('/vehicle/:vehicleId', async (req, res, next) => {
  try {
    const reviews = await Review.find({ vehicleId: req.params.vehicleId, isApproved: true })
      .populate('userId', 'name avatar').sort('-createdAt');
    res.json({ success: true, data: reviews });
  } catch (err) { next(err); }
});


// ============================================================
// routes/admin.js - Save to separate file in actual use
// ============================================================
const adminRouter = express.Router();
const { getDashboardStats, getPendingListings, approveVehicle, rejectVehicle, approveTour, getUsers, toggleUserBlock, getAllBookings } = require('../controllers/adminController');

adminRouter.use(protect, authorize('admin')); // All admin routes protected
adminRouter.get('/dashboard', getDashboardStats);
adminRouter.get('/pending-listings', getPendingListings);
adminRouter.put('/approve/vehicle/:id', approveVehicle);
adminRouter.delete('/reject/vehicle/:id', rejectVehicle);
adminRouter.put('/approve/tour/:id', approveTour);
adminRouter.get('/users', getUsers);
adminRouter.put('/users/:id/toggle-block', toggleUserBlock);
adminRouter.get('/bookings', getAllBookings);


// ============================================================
// routes/users.js - Save to separate file in actual use
// ============================================================
const usersRouter = express.Router();
const User = require('../models/User');

usersRouter.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user.toPublicProfile() });
  } catch (err) { next(err); }
});

// Export all routers
module.exports = {
  toursRouter: router,
  bookingRouter,
  paymentRouter,
  reviewRouter,
  adminRouter,
  usersRouter
};
