const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tenant name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  subdomain: {
    type: String,
    lowercase: true,
    trim: true
  },
  domain: {
    type: String,
    lowercase: true,
    trim: true
  },
  logo: {
    type: String,
    default: null
  },
  favicon: {
    type: String,
    default: null
  },
  branding: {
    primaryColor: {
      type: String,
      default: '#3B82F6'
    },
    secondaryColor: {
      type: String,
      default: '#1E40AF'
    },
    accentColor: {
      type: String,
      default: '#F59E0B'
    },
    backgroundColor: {
      type: String,
      default: '#F3F4F6'
    },
    textColor: {
      type: String,
      default: '#1F2937'
    },
    fontFamily: {
      type: String,
      default: 'Inter, system-ui, sans-serif'
    },
    customCSS: {
      type: String,
      default: ''
    }
  },
  plan: {
    type: String,
    enum: ['free', 'starter', 'pro', 'enterprise'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'cancelled', 'trial'],
    default: 'trial'
  },
  subscription: {
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    planId: String,
    status: String,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: Boolean
  },
  limits: {
    users: { type: Number, default: 1 },
    leads: { type: Number, default: 100 },
    contacts: { type: Number, default: 500 },
    deals: { type: Number, default: 50 },
    storage: { type: Number, default: 1073741824 } // 1GB in bytes
  },
  features: {
    aiInsights: { type: Boolean, default: true },
    advancedAnalytics: { type: Boolean, default: false },
    customBranding: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    whiteLabel: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    auditLog: { type: Boolean, default: false },
    twoFactorAuth: { type: Boolean, default: false }
  },
  settings: {
    defaultCurrency: { type: String, default: 'USD' },
    timezone: { type: String, default: 'UTC' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    enableEmailNotifications: { type: Boolean, default: true },
    enablePushNotifications: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: false },
    allowPublicLeadForms: { type: Boolean, default: true }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  autoIndex: true,
  autoCreate: true
});

// Indexes - Note: subdomain has unique: true in schema, no duplicate index needed
tenantSchema.index({ domain: 1 });
tenantSchema.index({ 'subscription.stripeCustomerId': 1 });
tenantSchema.index({ status: 1 });

// Virtual for URL
tenantSchema.virtual('url').get(function() {
  return this.subdomain 
    ? `https://${this.subdomain}.${process.env.APP_DOMAIN || 'localhost:3000'}`
    : `https://${this.domain || 'localhost:3000'}`;
});

// Pre-save hook to generate slug
tenantSchema.pre('save', async function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Ensure uniqueness
    const slugRegex = new RegExp(`^${this.slug}(-[0-9]+)?$`);
    const existingTenants = await this.constructor.find({ slug: slugRegex });
    if (existingTenants.length > 0) {
      this.slug = `${this.slug}-${existingTenants.length + 1}`;
    }
  }
  next();
});

// Check if feature is enabled
tenantSchema.methods.hasFeature = function(feature) {
  if (this.plan === 'enterprise') return true;
  if (this.plan === 'pro' && ['aiInsights', 'advancedAnalytics', 'auditLog'].includes(feature)) return true;
  return this.features[feature] || false;
};

// Check if limit is reached
tenantSchema.methods.isWithinLimit = function(resource) {
  return this.limits[resource] === -1 || 
         (this.limits[resource] && this.usage?.[resource] < this.limits[resource]);
};

module.exports = mongoose.model('Tenant', tenantSchema);
