const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');
const { requireTenant, requireFeature } = require('../middleware/tenant');

// Get current tenant
router.get('/current', authenticate, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenant)
      .populate('users', 'username email firstName lastName role status');
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        subdomain: tenant.subdomain,
        domain: tenant.domain,
        logo: tenant.logo,
        branding: tenant.branding,
        plan: tenant.plan,
        status: tenant.status,
        features: tenant.features,
        limits: tenant.limits,
        settings: tenant.settings,
        users: tenant.users,
        createdAt: tenant.createdAt
      }
    });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

// Update tenant branding
router.patch('/branding', authenticate, requireTenant, requireFeature('customBranding'), async (req, res) => {
  try {
    const { primaryColor, secondaryColor, accentColor, backgroundColor, textColor, fontFamily, customCSS, logo, favicon } = req.body;

    const updates = {};
    if (primaryColor) updates['branding.primaryColor'] = primaryColor;
    if (secondaryColor) updates['branding.secondaryColor'] = secondaryColor;
    if (accentColor) updates['branding.accentColor'] = accentColor;
    if (backgroundColor) updates['branding.backgroundColor'] = backgroundColor;
    if (textColor) updates['branding.textColor'] = textColor;
    if (fontFamily) updates['branding.fontFamily'] = fontFamily;
    if (customCSS !== undefined) updates['branding.customCSS'] = customCSS;
    if (logo !== undefined) updates.logo = logo;
    if (favicon !== undefined) updates.favicon = favicon;

    const tenant = await Tenant.findByIdAndUpdate(
      req.tenantId,
      { $set: updates },
      { new: true }
    );

    res.json({
      message: 'Branding updated',
      branding: tenant.branding,
      logo: tenant.logo
    });
  } catch (error) {
    console.error('Update branding error:', error);
    res.status(500).json({ error: 'Failed to update branding' });
  }
});

// Update tenant settings
router.patch('/settings', authenticate, requireTenant, async (req, res) => {
  try {
    const { defaultCurrency, timezone, dateFormat, enableEmailNotifications, enablePushNotifications } = req.body;

    const updates = {};
    if (defaultCurrency) updates['settings.defaultCurrency'] = defaultCurrency;
    if (timezone) updates['settings.timezone'] = timezone;
    if (dateFormat) updates['settings.dateFormat'] = dateFormat;
    if (enableEmailNotifications !== undefined) updates['settings.enableEmailNotifications'] = enableEmailNotifications;
    if (enablePushNotifications !== undefined) updates['settings.enablePushNotifications'] = enablePushNotifications;

    const tenant = await Tenant.findByIdAndUpdate(
      req.tenantId,
      { $set: updates },
      { new: true }
    );

    res.json({
      message: 'Settings updated',
      settings: tenant.settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get team members
router.get('/team', authenticate, requireTenant, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;

    const query = { tenant: req.tenantId, deletedAt: null };
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;

    const users = await User.find(query)
      .select('username email firstName lastName role status avatar lastLogin createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users: users.map(u => ({
        id: u._id,
        username: u.username,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: u.fullName,
        role: u.role,
        status: u.status,
        avatar: u.avatar,
        lastLogin: u.lastLogin,
        createdAt: u.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// Invite team member
router.post('/team/invite', authenticate, requireTenant, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Check if user already exists in this tenant
    const existingUser = await User.findOne({ email: email.toLowerCase(), tenant: req.tenantId });
    if (existingUser) {
      return res.status(400).json({ error: 'User already in team' });
    }

    // Check plan limits
    const tenant = await Tenant.findById(req.tenantId);
    const userCount = await User.countDocuments({ tenant: req.tenantId });
    if (userCount >= tenant.limits.users) {
      return res.status(403).json({ error: 'User limit reached', current: userCount, limit: tenant.limits.users });
    }

    // Create invitation token (simplified - in production, use proper invitation system)
    const invitationToken = require('crypto').randomBytes(32).toString('hex');

    // In a real app, send email with invitation link
    // For now, just return the token
    
    res.json({
      message: 'Invitation sent',
      invitationToken,
      // In production: send email to user
      debug: {
        email,
        role,
        expiresIn: '7 days'
      }
    });
  } catch (error) {
    console.error('Invite team member error:', error);
    res.status(500).json({ error: 'Failed to invite team member' });
  }
});

// Update team member
router.patch('/team/:userId', authenticate, requireTenant, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const { role, status } = req.body;

    const user = await User.findOne({ 
      _id: req.params.userId, 
      tenant: req.tenantId 
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent demoting owner
    if (user.role === 'owner' && req.body.role !== 'owner') {
      return res.status(403).json({ error: 'Cannot demote owner' });
    }

    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    res.json({
      message: 'Team member updated',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

// Remove team member
router.delete('/team/:userId', authenticate, requireTenant, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const user = await User.findOne({ 
      _id: req.params.userId, 
      tenant: req.tenantId 
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'owner') {
      return res.status(403).json({ error: 'Cannot remove owner' });
    }

    user.deletedAt = new Date();
    user.deletedBy = req.user._id;
    await user.save();

    res.json({ message: 'Team member removed' });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
});

module.exports = router;
