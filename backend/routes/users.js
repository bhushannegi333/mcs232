const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
router.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user.toPublicProfile() });
  } catch (err) { next(err); }
});
module.exports = router;
