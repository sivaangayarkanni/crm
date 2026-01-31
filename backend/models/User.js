const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  avatar: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'manager', 'member', 'viewer'],
    default: 'member'
  },
  permissions: {
    leads: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: true },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    contacts: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: true },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    deals: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: true },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    analytics: {
      view: { type: Boolean, default: false },
      export: { type: Boolean, default: false }
    },
    settings: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    },
    team: {
      view: { type: Boolean, default: false },
      manage: { type: Boolean, default: false }
    }
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'pending'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date
  }],
  activityLog: [{
    action: String,
    details: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now }
  }],
  preferences: {
    theme: { type: String, default: 'light' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      leadUpdates: { type: Boolean, default: true },
      dealUpdates: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false }
    },
    dashboard: {
      layout: { type: String, default: 'default' },
      widgets: { type: [String], default: [] }
    }
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1, tenant: 1 }, { unique: true });
userSchema.index({ username: 1, tenant: 1 }, { unique: true });
userSchema.index({ tenant: 1 });
userSchema.index({ role: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.username;
});

// Check if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if password needs re-hashing
userSchema.methods.shouldRehashPassword = async function() {
  const salt = await bcrypt.genSalt(12);
  const currentHash = await bcrypt.hash(this.password, salt);
  return currentHash !== this.password;
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
    return;
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // Lock for 2 hours
  }
  
  await this.updateOne(updates);
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = async function() {
  await this.updateOne({
    $set: { 
      loginAttempts: 0, 
      lastLogin: new Date(),
      status: 'active'
    },
    $unset: { lockUntil: 1 }
  });
};

// Add activity log entry
userSchema.methods.logActivity = async function(action, details, req) {
  await this.updateOne({
    $push: {
      activityLog: {
        $each: [{
          action,
          details,
          ip: req?.ip,
          userAgent: req?.get('User-Agent'),
          createdAt: new Date()
        }],
        $slice: -100 // Keep only last 100 entries
      }
    }
  });
};

// Role-based permission checker
userSchema.methods.hasPermission = function(resource, action) {
  if (this.role === 'owner' || this.role === 'admin') return true;
  
  const resourcePermissions = this.permissions?.[resource];
  if (!resourcePermissions) return false;
  
  return resourcePermissions[action] === true;
};

// Set default permissions based on role
userSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    const rolePermissions = {
      owner: {
        leads: { create: true, read: true, update: true, delete: true },
        contacts: { create: true, read: true, update: true, delete: true },
        deals: { create: true, read: true, update: true, delete: true },
        analytics: { view: true, export: true },
        settings: { view: true, edit: true },
        team: { view: true, manage: true }
      },
      admin: {
        leads: { create: true, read: true, update: true, delete: true },
        contacts: { create: true, read: true, update: true, delete: true },
        deals: { create: true, read: true, update: true, delete: true },
        analytics: { view: true, export: true },
        settings: { view: true, edit: true },
        team: { view: true, manage: true }
      },
      manager: {
        leads: { create: true, read: true, update: true, delete: false },
        contacts: { create: true, read: true, update: true, delete: false },
        deals: { create: true, read: true, update: true, delete: false },
        analytics: { view: true, export: true },
        settings: { view: true, edit: false },
        team: { view: true, manage: false }
      },
      member: {
        leads: { create: true, read: true, update: true, delete: false },
        contacts: { create: true, read: true, update: true, delete: false },
        deals: { create: true, read: true, update: true, delete: false },
        analytics: { view: false, export: false },
        settings: { view: false, edit: false },
        team: { view: false, manage: false }
      },
      viewer: {
        leads: { create: false, read: true, update: false, delete: false },
        contacts: { create: false, read: true, update: false, delete: false },
        deals: { create: false, read: true, update: false, delete: false },
        analytics: { view: false, export: false },
        settings: { view: false, edit: false },
        team: { view: false, manage: false }
      }
    };
    
    this.permissions = rolePermissions[this.role] || rolePermissions.member;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
