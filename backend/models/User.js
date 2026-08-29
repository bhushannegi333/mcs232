// ============================================================
// models/User.js - User Schema (Traveler / Owner / Admin)
// ============================================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Never returned in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'owner', 'admin'],
    default: 'user'
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number']
  },
  avatar: {
    type: String,
    default: ''
  },
  address: {
    street: String,
    city: String,
    state: { type: String, default: 'Uttarakhand' },
    pincode: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// ─── Index for performance ──────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// ─── Pre-save hook: Hash password before saving ─────────
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// ─── Instance method: Compare password ──────────────────
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// ─── Instance method: Get public profile (no sensitive data) ─
userSchema.methods.toPublicProfile = function() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone,
    avatar: this.avatar,
    address: this.address,
    isActive: this.isActive,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
