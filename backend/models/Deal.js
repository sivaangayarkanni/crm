const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
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
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Basic Information
  title: {
    type: String,
    required: [true, 'Deal title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  
  // Value & Currency
  value: {
    type: Number,
    required: [true, 'Deal value is required'],
    min: [0, 'Deal value cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Pipeline & Stage
  pipeline: {
    type: String,
    default: 'default'
  },
  stage: {
    type: String,
    enum: ['qualification', 'discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
    default: 'qualification'
  },
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 10
  },
  
  // AI Predictions
  aiPrediction: {
    winProbability: { type: Number, min: 0, max: 1 },
    predictedCloseDate: Date,
    recommendedDiscount: Number,
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    riskFactors: [String],
    suggestedNextSteps: [String],
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative']
    }
  },
  
  // Related Records
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },
  company: {
    type: String,
    trim: true
  },
  
  // Dates
  expectedCloseDate: Date,
  actualCloseDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
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
  
  // Deal Score
  dealScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['open', 'won', 'lost', 'on_hold'],
    default: 'open'
  },
  lostReason: {
    type: String,
    enum: ['price', 'competition', 'no_decision', 'timing', 'quality', 'other'],
    default: null
  },
  lostReasonDetails: String,
  
  // Engagement
  engagement: {
    emailsSent: { type: Number, default: 0 },
    emailsOpened: { type: Number, default: 0 },
    emailsClicked: { type: Number, default: 0 },
    callsMade: { type: Number, default: 0 },
    meetingsHeld: { type: Number, default: 0 },
    proposalsSent: { type: Number, default: 0 },
    lastActivityAt: Date
  },
  
  // Timeline / Activities
  activities: [{
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'note', 'task', 'proposal', 'change_stage']
    },
    description: String,
    outcome: String,
    duration: Number, // in minutes
    scheduledAt: Date,
    completedAt: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Products/Services
  lineItems: [{
    name: String,
    description: String,
    quantity: Number,
    unitPrice: Number,
    discount: Number,
    total: Number
  }],
  
  // Source
  source: {
    type: String,
    enum: ['lead_conversion', 'manual', 'import', 'api', 'other'],
    default: 'manual'
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
dealSchema.index({ tenant: 1, status: 1 });
dealSchema.index({ tenant: 1, stage: 1 });
dealSchema.index({ tenant: 1, assignedTo: 1 });
dealSchema.index({ tenant: 1, expectedCloseDate: 1 });
dealSchema.index({ tenant: 1, value: -1 });
dealSchema.index({ tenant: 1, createdAt: -1 });
dealSchema.index({ contact: 1 });
dealSchema.index({ lead: 1 });
dealSchema.index({ tags: 1 });
dealSchema.index({ deletedAt: 1 });

// Virtual for formatted value
dealSchema.virtual('formattedValue').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency || 'USD'
  }).format(this.value);
});

// Virtual for days until close
dealSchema.virtual('daysUntilClose').get(function() {
  if (!this.expectedCloseDate) return null;
  const diff = new Date(this.expectedCloseDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for weighted value
dealSchema.virtual('weightedValue').get(function() {
  return this.value * (this.probability / 100);
});

// Pre-save hook for AI prediction
dealSchema.pre('save', function(next) {
  if (this.isModified('stage') || this.isModified('value') || 
      this.isModified('engagement') || this.isModified('activities')) {
    this.calculateAIPrediction();
  }
  next();
});

// AI Prediction Method
dealSchema.methods.calculateAIPrediction = function() {
  // Calculate win probability based on stage and engagement
  const stageProbabilities = {
    qualification: 0.15,
    discovery: 0.25,
    proposal: 0.50,
    negotiation: 0.75,
    closed_won: 1.0,
    closed_lost: 0.0
  };
  
  let winProbability = stageProbabilities[this.stage] || 0.10;
  
  // Adjust based on engagement
  const engagementScore = Math.min(0.2, 
    (this.engagement.emailsOpened * 0.01) +
    (this.engagement.emailsClicked * 0.02) +
    (this.engagement.callsMade * 0.03) +
    (this.engagement.meetingsHeld * 0.05) +
    (this.engagement.proposalsSent * 0.05)
  );
  
  winProbability = Math.min(0.95, winProbability + engagementScore);
  
  // Calculate risk factors
  const riskFactors = [];
  let riskLevel = 'low';
  
  if (this.expectedCloseDate) {
    const daysUntilClose = Math.ceil((new Date(this.expectedCloseDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilClose < 0) {
      riskFactors.push('Deal is past expected close date');
      riskLevel = 'high';
    } else if (daysUntilClose < 7) {
      riskFactors.push('Close date is very soon');
      if (winProbability < 0.5) riskLevel = 'high';
    }
  }
  
  if (this.value > 100000 && winProbability > 0.8) {
    riskFactors.push('High-value deal approaching close - consider additional verification');
  }
  
  if (this.activities.length === 0) {
    riskFactors.push('No recent activity on deal');
    if (riskLevel === 'low') riskLevel = 'medium';
  }
  
  if (this.probability < 30 && this.engagement.meetingsHeld === 0) {
    riskFactors.push('Low probability with no meetings held');
    if (riskLevel !== 'high') riskLevel = 'medium';
  }
  
  // Suggested next steps
  const suggestedNextSteps = [];
  if (this.stage === 'qualification') {
    suggestedNextSteps.push('Schedule discovery call');
    suggestedNextSteps.push('Gather requirements');
  } else if (this.stage === 'discovery') {
    suggestedNextSteps.push('Prepare proposal');
    suggestedNextSteps.push('Identify decision makers');
  } else if (this.stage === 'proposal') {
    suggestedNextSteps.push('Follow up on proposal');
    suggestedNextSteps.push('Address questions');
  } else if (this.stage === 'negotiation') {
    suggestedNextSteps.push('Prepare negotiation strategy');
    suggestedNextSteps.push('Discuss internally about discounts');
  }
  
  // Determine sentiment
  let sentiment = 'neutral';
  if (winProbability >= 0.7) sentiment = 'positive';
  else if (winProbability < 0.3) sentiment = 'negative';
  
  // Calculate deal score
  const dealScore = Math.round(
    (winProbability * 50) +
    (this.engagement.meetingsHeld * 5) +
    (this.engagement.proposalsSent * 3) +
    Math.min(20, this.value / 10000)
  );
  
  // Update AI fields
  this.aiPrediction = {
    winProbability,
    riskLevel,
    riskFactors,
    suggestedNextSteps,
    sentiment
  };
  this.dealScore = Math.min(100, dealScore);
};

// Static method for pipeline aggregation
dealSchema.statics.getPipelineStats = function(tenantId) {
  return this.aggregate([
    { $match: { tenant: new mongoose.Types.ObjectId(tenantId), status: 'open', deletedAt: null } },
    { $group: {
      _id: '$stage',
      count: { $sum: 1 },
      totalValue: { $sum: '$value' },
      avgProbability: { $avg: '$probability' },
      avgDealScore: { $avg: '$dealScore' },
      weightedValue: { $sum: { $multiply: ['$value', { $divide: ['$probability', 100] }] } }
    }},
    { $sort: { _id: 1 } }
  ]);
};

// Static method for find by tenant
dealSchema.statics.findByTenant = function(tenantId, options = {}) {
  const query = this.find({ 
    tenant: tenantId,
    deletedAt: null 
  });
  
  if (options.status) query.where('status', options.status);
  if (options.stage) query.where('stage', options.stage);
  if (options.assignedTo) query.where('assignedTo', options.assignedTo);
  if (options.contact) query.where('contact', options.contact);
  if (options.minValue) query.where('value').gte(options.minValue);
  if (options.maxValue) query.where('value').lte(options.maxValue);
  if (options.pipeline) query.where('pipeline', options.pipeline);
  if (options.tags && options.tags.length) query.where('tags').in(options.tags);
  
  if (options.search) {
    const searchRegex = new RegExp(options.search, 'i');
    query.or([
      { title: searchRegex },
      { company: searchRegex }
    ]);
  }
  
  if (options.sortBy) {
    const sortDir = options.sortOrder === 'asc' ? 1 : -1;
    query.sort({ [options.sortBy]: sortDir });
  } else {
    query.sort({ expectedCloseDate: 1 });
  }
  
  if (options.page) {
    const limit = options.limit || 20;
    query.skip((options.page - 1) * limit).limit(limit);
  }
  
  return query.populate('contact', 'name email company');
};

module.exports = mongoose.model('Deal', dealSchema);
