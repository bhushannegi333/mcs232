// ============================================================
// routes/vehicles.js
// ============================================================
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middleware/auth');
const { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle, getMyVehicles } = require('../controllers/vehicleController');

// ─── Multer config for local image uploads ────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/vehicles/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).substr(2,9)}${path.extname(file.originalname)}`)
});
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  cb(null, allowed.includes(file.mimetype));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

router.get('/', getVehicles);
router.get('/my-listings', protect, authorize('owner', 'admin'), getMyVehicles);
router.get('/:id', getVehicleById);
router.post('/', protect, authorize('owner', 'admin'), upload.array('images', 5), createVehicle);
router.put('/:id', protect, authorize('owner', 'admin'), upload.array('images', 5), updateVehicle);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteVehicle);

module.exports = router;
