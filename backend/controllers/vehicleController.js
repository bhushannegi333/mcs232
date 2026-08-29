// ============================================================
// controllers/vehicleController.js - Vehicle CRUD Logic
// ============================================================

const Vehicle = require('../models/Vehicle');

// ─── GET /api/vehicles - Search & list all approved vehicles ─
const getVehicles = async (req, res, next) => {
  try {
    const {
      city, vehicleType, seats, minPrice, maxPrice,
      page = 1, limit = 12, sort = '-createdAt',
      features, fuelType
    } = req.query;

    const filter = { isApproved: true, isAvailable: true };

    if (city)        filter.city = city;
    if (vehicleType) filter.vehicleType = vehicleType;
    if (fuelType)    filter.fuelType = fuelType;
    if (seats)       filter.seats = { $gte: parseInt(seats) };
    if (minPrice || maxPrice) {
      filter.pricePerDay = {};
      if (minPrice) filter.pricePerDay.$gte = parseInt(minPrice);
      if (maxPrice) filter.pricePerDay.$lte = parseInt(maxPrice);
    }
    if (features) {
      const featureArr = features.split(',');
      filter.features = { $all: featureArr };
    }

    const total = await Vehicle.countDocuments(filter);
    const vehicles = await Vehicle.find(filter)
      .populate('ownerId', 'name phone avatar')
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: vehicles.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: vehicles
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/vehicles/:id ─────────────────────────────────
const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('ownerId', 'name phone email avatar');
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }
    res.json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/vehicles - Owner creates listing ───────────
const createVehicle = async (req, res, next) => {
  try {
    const vehicleData = {
      ...req.body,
      ownerId: req.user._id,
      isApproved: false // Requires admin approval
    };

    // Handle uploaded image paths
    if (req.files && req.files.length > 0) {
      vehicleData.images = req.files.map(f => `/uploads/vehicles/${f.filename}`);
    }

    const vehicle = await Vehicle.create(vehicleData);
    res.status(201).json({
      success: true,
      message: 'Vehicle submitted for admin approval.',
      data: vehicle
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/vehicles/:id - Owner updates their vehicle ──
const updateVehicle = async (req, res, next) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }
    // Ensure only the owner (or admin) can update
    if (vehicle.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this vehicle.' });
    }

    // If owner updates, reset approval
    if (req.user.role !== 'admin') req.body.isApproved = false;

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map(f => `/uploads/vehicles/${f.filename}`);
    }

    vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, message: 'Vehicle updated successfully.', data: vehicle });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/vehicles/:id ─────────────────────────────
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }
    if (vehicle.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    await vehicle.deleteOne();
    res.json({ success: true, message: 'Vehicle deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/vehicles/my-listings - Owner's own vehicles ─
const getMyVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ ownerId: req.user._id }).sort('-createdAt');
    res.json({ success: true, count: vehicles.length, data: vehicles });
  } catch (err) {
    next(err);
  }
};

module.exports = { getVehicles, getVehicleById, createVehicle, updateVehicle, deleteVehicle, getMyVehicles };
