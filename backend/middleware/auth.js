// ============================================================
// middleware/auth.js - JWT Authentication & Role Authorization
// ============================================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect - Verifies JWT token and attaches user to req.user
 * Usage: router.get('/protected', protect, handler)
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header (Bearer <token>)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    // Verify JWT signature and decode payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user from DB (exclude passwordHash)
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Token invalid. User not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated. Contact support.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    next(err);
  }
};

/**
 * authorize - Role-based access control
 * Usage: router.get('/admin-only', protect, authorize('admin'), handler)
 * Usage: router.post('/owner-or-admin', protect, authorize('owner', 'admin'), handler)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${req.user.role} role is not authorized for this action.`
      });
    }
    next();
  };
};

/**
 * generateToken - Creates a signed JWT
 * @param {string} id - User MongoDB _id
 * @param {string} role - User role
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

module.exports = { protect, authorize, generateToken };
