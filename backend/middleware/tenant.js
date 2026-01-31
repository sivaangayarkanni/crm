const Tenant = require('../models/Tenant');

// Multi-tenant middleware - extracts tenant from subdomain, domain, or header
const extractTenant = async (req, res, next) => {
  try {
    let tenantId = null;
    let tenant = null;

    // Priority: header -> subdomain -> domain -> default
    const tenantHeader = req.headers['x-tenant-id'];
    const subdomain = getSubdomain(req.hostname);
    const domain = req.hostname;

    if (tenantHeader) {
      // Tenant ID provided in header (useful for API access)
      tenant = await Tenant.findById(tenantHeader);
    } else if (subdomain && subdomain !== 'www' && subdomain !== 'api' && subdomain !== 'localhost') {
      // Subdomain-based tenant
      tenant = await Tenant.findOne({ 
        subdomain: subdomain,
        status: { $ne: 'cancelled' }
      });
    } else if (domain !== 'localhost' && domain !== 'www.localhost') {
      // Custom domain
      tenant = await Tenant.findOne({ 
        domain: domain,
        status: { $ne: 'cancelled' }
      });
    }

    if (!tenant) {
      // For development, create a default tenant or use demo
      if (process.env.NODE_ENV !== 'production' && req.hostname.includes('localhost')) {
        req.tenant = null; // Allow access without tenant for localhost
        req.isTenantResolution = true;
        return next();
      }
      
      return res.status(404).json({
        error: 'Tenant not found',
        message: 'Unable to identify the organization'
      });
    }

    // Check tenant status
    if (tenant.status === 'suspended') {
      return res.status(403).json({
        error: 'Tenant suspended',
        message: 'This organization\'s account has been suspended'
      });
    }

    if (tenant.status === 'trial' && !tenant.subscription?.currentPeriodEnd) {
      // Trial expired - redirect to billing
      return res.status(403).json({
        error: 'Trial expired',
        message: 'Your trial period has expired. Please upgrade to continue.',
        code: 'TRIAL_EXPIRED'
      });
    }

    req.tenant = tenant;
    req.tenantId = tenant._id;
    req.isTenantResolution = true;
    next();
  } catch (error) {
    console.error('Tenant extraction error:', error);
    res.status(500).json({ error: 'Failed to resolve tenant' });
  }
};

// Require tenant (fail if not resolved)
const requireTenant = (req, res, next) => {
  if (!req.tenant) {
    return res.status(400).json({
      error: 'Tenant required',
      message: 'This endpoint requires a tenant context'
    });
  }
  next();
};

// Check tenant subscription status
const requireActiveSubscription = (req, res, next) => {
  if (!req.tenant) {
    return res.status(400).json({ error: 'Tenant required' });
  }

  const allowedStatuses = ['active', 'trial'];
  if (!allowedStatuses.includes(req.tenant.status)) {
    return res.status(403).json({
      error: 'Subscription required',
      message: 'Active subscription required to access this feature'
    });
  }
  next();
};

// Check tenant plan
const requirePlan = (...plans) => {
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(400).json({ error: 'Tenant required' });
    }

    const planHierarchy = ['free', 'starter', 'pro', 'enterprise'];
    const userPlanIndex = planHierarchy.indexOf(req.tenant.plan);
    const requiredPlans = plans.map(p => planHierarchy.indexOf(p));

    const hasAccess = requiredPlans.some(requiredIndex => userPlanIndex >= requiredIndex);

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Plan upgrade required',
        message: `This feature requires a ${plans.join(' or ')} plan`,
        currentPlan: req.tenant.plan,
        requiredPlans: plans
      });
    }

    next();
  };
};

// Check tenant feature access
const requireFeature = (feature) => {
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(400).json({ error: 'Tenant required' });
    }

    if (req.tenant.plan === 'enterprise') {
      return next();
    }

    if (!req.tenant.features[feature]) {
      return res.status(403).json({
        error: 'Feature not available',
        message: `This feature is not enabled for your plan`,
        feature,
        upgradeRequired: req.tenant.plan !== 'enterprise'
      });
    }

    next();
  };
};

// Check resource limits
const checkLimits = (resource) => {
  return async (req, res, next) => {
    if (!req.tenant) {
      return next();
    }

    const limit = req.tenant.limits[resource];
    if (!limit || limit === -1) {
      return next();
    }

    // This would typically query the database to get current usage
    // For now, we'll just pass through
    next();
  };
};

// Helper function to extract subdomain
function getSubdomain(hostname) {
  if (!hostname) return null;
  
  const parts = hostname.split('.');
  
  // Handle localhost
  if (parts[parts.length - 1] === 'localhost' || parts[parts.length - 1] === 'local') {
    return null;
  }
  
  // Handle port numbers
  const firstPart = parts[0].split(':')[0];
  
  // If first part is 'www', check the next part
  if (firstPart === 'www') {
    return parts[1] || null;
  }
  
  // Otherwise, first part is the subdomain
  return firstPart;
}

// Add tenant scope to query
const addTenantScope = (model) => {
  return async (req, res, next) => {
    if (!req.tenant) {
      return next();
    }

    // Add tenant filter to common query methods
    const originalQuery = model.find.bind(model);
    model.find = function(...args) {
      const query = originalQuery(...args);
      query.where('tenant').equals(req.tenantId);
      return query;
    };

    next();
  };
};

// Ensure user belongs to the same tenant
const ensureSameTenant = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.body.userId;
    
    if (!userId) {
      return next();
    }

    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.tenant.toString() !== req.tenantId.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'User does not belong to this organization'
      });
    }

    next();
  } catch (error) {
    console.error('Tenant check error:', error);
    res.status(500).json({ error: 'Failed to verify tenant access' });
  }
};

// Add tenant to all created documents
const tenantScope = (req, res, next) => {
  if (!req.tenant) {
    return next();
  }

  // Add tenant ID to request for use in controllers
  req.tenantScope = {
    tenant: req.tenantId,
    addedBy: req.user?._id,
    addedAt: new Date()
  };

  next();
};

module.exports = {
  extractTenant,
  requireTenant,
  requireActiveSubscription,
  requirePlan,
  requireFeature,
  checkLimits,
  addTenantScope,
  ensureSameTenant,
  tenantScope,
  getSubdomain
};
