// ============================================================
// controllers/authController.js - Auth Business Logic
// ============================================================

const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');
const crypto = require('crypto');

// ─── POST /api/auth/register ─────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    // Prevent self-registering as admin
    const assignedRole = role === 'admin' ? 'user' : (role || 'user');

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: password,
      role: assignedRole,
      phone
    });

    // Send welcome email (non-blocking)
    sendEmail({
      to: user.email,
      subject: '🏔️ Welcome to Banjare - Explore Uttarakhand',
      template: 'welcome',
      data: { name: user.name }
    }).catch(err => console.error('Welcome email failed:', err));

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to Banjare.',
      token,
      user: user.toPublicProfile()
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/login ────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find user and include passwordHash for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact support.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: user.toPublicProfile()
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/auth/me ────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user: user.toPublicProfile() });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/auth/update-profile ────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Profile updated successfully.', user: user.toPublicProfile() });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/change-password ──────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+passwordHash');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/forgot-password ──────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: '🔑 Banjare Password Reset',
      template: 'resetPassword',
      data: { name: user.name, resetUrl }
    });

    res.json({ success: true, message: 'Password reset email sent.' });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/reset-password ───────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    user.passwordHash = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. Please login.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword, forgotPassword, resetPassword };
