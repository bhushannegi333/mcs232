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
    const tours = await Tour.find(filter).populate('ownerId','name phone').sort('-createdAt').skip((parseInt(page)-1)*parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, total, data: tours });
  } catch (err) { next(err); }
});
router.get('/:id', async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id).populate('ownerId','name phone avatar');
    if (!tour) return res.status(404).json({ success: false, message: 'Tour not found.' });
    res.json({ success: true, data: tour });
  } catch (err) { next(err); }
});
router.post('/', protect, authorize('owner','admin'), async (req, res, next) => {
  try {
    const tour = await Tour.create({ ...req.body, ownerId: req.user._id, isApproved: false });
    res.status(201).json({ success: true, data: tour });
  } catch (err) { next(err); }
});
module.exports = router;
