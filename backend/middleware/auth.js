const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const user = await User.findById(decoded.userId)
        .select('-password -refreshTokens -twoFactorSecret');
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({ error: 'Account is suspended' });
      }

      if (user.isLocked) {
        return res.status(423).json({ error: 'Account is locked' });
      }

      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Verify JWT token for Socket.io
const authenticateSocket = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId)
      .select('-password -refreshTokens -twoFactorSecret')
      .populate('tenant', 'name slug plan status');
    
    if (!user || user.status === 'suspended') {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId)
          .select('-password -refreshTokens -twoFactorSecret');
        
        if (user && user.status === 'active') {
          req.user = user;
          req.token = token;
        }
      } catch (error) {
        // Token invalid, continue without user
      }
    }
    next();
  } catch (error) {
    next();
  }
};

// Check user roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        required: roles,
        current: req.user.role
      });
    }
    
    next();
  };
};

// Check specific permission
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!req.user.hasPermission(resource, action)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        resource,
        action
      });
    }
    
    next();
  };
};

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Verify refresh token and generate new tokens
const refreshTokens = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }
    
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET);
      
      const user = await User.findById(decoded.userId)
        .select('+refreshTokens');
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      // Check if refresh token exists in user's tokens
      const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
      if (!tokenExists) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }
      
      // Remove old refresh token
      user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
      
      // Generate new tokens
      const tokens = generateTokens(user._id);
      
      // Save new refresh token
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
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

module.exports = {
  authenticate,
  authenticateSocket,
  optionalAuth,
  requireRole,
  requirePermission,
  generateTokens,
  refreshTokens,
  JWT_SECRET
};
