const express = require('express');
const router = express.Router();
const Joi = require('joi');
const crypto = require('crypto');
const { authenticate, generateTokens, refreshTokens, JWT_SECRET } = require('../middleware/auth');
const Tenant = require('../models/Tenant');
const User = require('../models/User');

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  username: Joi.string().min(3).max(30).required(),
  firstName: Joi.string().max(50),
  lastName: Joi.string().max(50),
  tenantName: Joi.string().min(3).max(100).required(),
  tenantSlug: Joi.string().min(3).max(50).pattern(/^[a-z0-9-]+$/),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  remember: Joi.boolean().default(false)
});

// Register new tenant and owner
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Validation error', details: error.details });
    }

    const { email, password, username, firstName, lastName, tenantName, tenantSlug } = value;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Create tenant
    const tenant = new Tenant({
      name: tenantName,
      slug: tenantSlug || tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      subdomain: tenantSlug || tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      owner: null, // Will be updated after user creation
      users: [],
      status: 'trial'
    });

    await tenant.validate(); // Validate tenant
    await tenant.save();

    // Create owner user
    const user = new User({
      email: email.toLowerCase(),
      password, // Will be hashed by pre-save hook
      username: username.toLowerCase(),
      firstName,
      lastName,
      role: 'owner',
      tenant: tenant._id,
      status: 'active'
    });

    await user.validate();
    await user.save();

    // Update tenant with owner reference
    tenant.owner = user._id;
    tenant.users = [user._id];
    await tenant.save();

    // Generate tokens
    const tokens = generateTokens(user._id);

    // Save refresh token
    user.refreshTokens.push({
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    await user.save();

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Resource already exists', message: 'Email or username already taken' });
    }
    
    res.status(500).json({ error: 'Registration failed', message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Validation error', details: error.details });
    }

    const { email, password } = value;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('tenant', 'name slug subdomain plan status branding features');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({ 
        error: 'Account locked',
        message: 'Too many failed attempts. Please try again later.'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check status
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended' });
    }

    if (user.status === 'pending') {
      // Auto-activate on first login
      user.status = 'active';
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate tokens
    const tokens = generateTokens(user._id);

    // Save refresh token
    user.refreshTokens.push({
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    // Keep only last 5 refresh tokens
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    
    await user.save();

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        preferences: user.preferences
      },
      tenant: user.tenant ? {
        id: user.tenant._id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        subdomain: user.tenant.subdomain,
        plan: user.tenant.plan,
        branding: user.tenant.branding,
        features: user.tenant.features
      } : null,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh tokens
router.post('/refresh', refreshTokens);

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('tenant', 'name slug subdomain plan status branding features limits');

    res.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions,
        avatar: user.avatar,
        phone: user.phone,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      tenant: user.tenant ? {
        id: user.tenant._id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        subdomain: user.tenant.subdomain,
        plan: user.tenant.plan,
        status: user.tenant.status,
        branding: user.tenant.branding,
        features: user.tenant.features,
        limits: user.tenant.limits
      } : null
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Update profile
router.patch('/me', authenticate, async (req, res) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'phone', 'avatar', 'preferences'];
    const updates = {};
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('tenant', 'name slug subdomain plan status');

    res.json({
      message: 'Profile updated',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    // Invalidate all refresh tokens except current
    const currentToken = req.headers.authorization?.split(' ')[1];
    user.refreshTokens = user.refreshTokens.filter(t => t.token === currentToken);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { refreshTokens: { token: refreshToken } }
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Logout all devices
router.post('/logout-all', authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $set: { refreshTokens: [] }
    });

    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Failed to logout from all devices' });
  }
});

module.exports = router;
