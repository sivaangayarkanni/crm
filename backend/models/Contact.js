const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Basic Information
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  jobTitle: {
    type: String,
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  department: {
    type: String,
    trim: true
  },
  
  // Contact Type & Status
  type: {
    type: String,
    enum: ['customer', 'prospect', 'partner', 'vendor', 'other'],
    default: 'prospect'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  
  // Social Links
  social: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String,
    skype: String
  },
  
  // Communication Preferences
  preferences: {
    preferredContact: {
      type: String,
      enum: ['email', 'phone', 'both'],
      default: 'email'
    },
    emailOptOut: {
      type: Boolean,
      default: false
    },
    smsOptOut: {
      type: Boolean,
      default: false
    },
    doNotContact: {
      type: Boolean,
      default: false
    }
  },
  
  // Tags & Custom Fields
  tags: [{
    type: String,
    trim: true
  }],
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Related Records
  leads: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  }],
  deals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal'
  }],
  
  // Engagement History
  engagement: {
    totalEmailsSent: { type: Number, default: 0 },
    emailsOpened: { type: Number, default: 0 },
    emailsClicked: { type: Number, default: 0 },
    callsMade: { type: Number, default: 0 },
    meetingsHeld: { type: Number, default: 0 },
    lastContactAt: Date,
    lastEmailAt: Date,
    lastCallAt: Date
  },
  
  // Notes
  notes: [{
    content: String,
    type: {
      type: String,
      enum: ['general', 'call', 'email', 'meeting', 'followup'],
      default: 'general'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Source
  source: {
    type: String,
    enum: ['manual', 'import', 'lead_conversion', 'api', 'other'],
    default: 'manual'
  },
  importedFrom: {
    type: String,
    trim: true
  },
  
  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Soft Delete
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
contactSchema.index({ tenant: 1, status: 1 });
contactSchema.index({ tenant: 1, type: 1 });
contactSchema.index({ tenant: 1, email: 1 });
contactSchema.index({ tenant: 1, phone: 1 });
contactSchema.index({ tenant: 1, company: 1 });
contactSchema.index({ tenant: 1, createdAt: -1 });
contactSchema.index({ tags: 1 });
contactSchema.index({ deletedAt: 1 });

// Virtual for full address
contactSchema.virtual('fullAddress').get(function() {
  if (!this.address) return null;
  const parts = [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.postalCode,
    this.address.country
  ].filter(Boolean);
  return parts.join(', ');
});

// Virtual for engagement score
contactSchema.virtual('engagementScore').get(function() {
  const score = 
    (this.engagement.emailsOpened * 1) +
    (this.engagement.emailsClicked * 2) +
    (this.engagement.callsMade * 3) +
    (this.engagement.meetingsHeld * 5);
  return Math.min(100, score);
});

// Static method for find by tenant
contactSchema.statics.findByTenant = function(tenantId, options = {}) {
  const query = this.find({ 
    tenant: tenantId,
    deletedAt: null 
  });
  
  if (options.status) query.where('status', options.status);
  if (options.type) query.where('type', options.type);
  if (options.company) query.where('company', options.company);
  if (options.tags && options.tags.length) query.where('tags').in(options.tags);
  
  if (options.search) {
    const searchRegex = new RegExp(options.search, 'i');
    query.or([
      { name: searchRegex },
      { email: searchRegex },
      { company: searchRegex }
    ]);
  }
  
  if (options.sortBy) {
    const sortDir = options.sortOrder === 'asc' ? 1 : -1;
    query.sort({ [options.sortBy]: sortDir });
  } else {
    query.sort({ createdAt: -1 });
  }
  
  if (options.page) {
    const limit = options.limit || 20;
    query.skip((options.page - 1) * limit).limit(limit);
  }
  
  return query;
};

module.exports = mongoose.model('Contact', contactSchema);
