const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Review } = require('../models/PaymentReview');
router.post('/', protect, async (req, res, next) => {
  try {
    const { vehicleId, tourId, bookingId, rating, comment } = req.body;
    const existing = await Review.findOne({ userId: req.user._id, bookingId });
    if (existing) return res.status(400).json({ success: false, message: 'Already reviewed.' });
    const review = await Review.create({ userId: req.user._id, vehicleId, tourId, bookingId, rating, comment });
    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
});
router.get('/vehicle/:vehicleId', async (req, res, next) => {
  try {
    const reviews = await Review.find({ vehicleId: req.params.vehicleId, isApproved: true }).populate('userId', 'name avatar').sort('-createdAt');
    res.json({ success: true, data: reviews });
  } catch (err) { next(err); }
});
module.exports = router;
