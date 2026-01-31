const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: [true, 'Lead name is required'],
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
  
  // Lead Source & Status
  source: {
    type: String,
    enum: ['website', 'referral', 'social', 'ads', 'email', 'event', 'partner', 'other'],
    default: 'website'
  },
  sourceDetails: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // AI-Powered Scoring
  aiScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  aiGrade: {
    type: String,
    enum: ['cold', 'cool', 'warm', 'hot'],
    default: 'cold'
  },
  aiPrediction: {
    conversionProbability: { type: Number, min: 0, max: 1 },
    recommendedAction: String,
    nextBestStep: String,
    keywords: [String],
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative']
    }
  },
  aiFactors: [{
    name: String,
    points: Number,
    icon: String,
    description: String
  }],
  aiAnalyzedAt: Date,
  
  // Scoring History
  scoreHistory: [{
    score: Number,
    grade: String,
    factors: mongoose.Schema.Types.Mixed,
    analyzedAt: { type: Date, default: Date.now }
  }],
  
  // Engagement Metrics
  engagement: {
    emailsOpened: { type: Number, default: 0 },
    emailsClicked: { type: Number, default: 0 },
    callsAttempted: { type: Number, default: 0 },
    callsConnected: { type: Number, default: 0 },
    meetingsHeld: { type: Number, default: 0 },
    pagesVisited: { type: Number, default: 0 },
    formsSubmitted: { type: Number, default: 0 },
    lastEngagementAt: Date
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
  
  // Location Data
  location: {
    country: String,
    state: String,
    city: String,
    timezone: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Social Links
  social: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String
  },
  
  // Notes & Activity
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
  
  // Conversion Tracking
  converted: {
    type: Boolean,
    default: false
  },
  convertedAt: Date,
  convertedTo: {
    type: {
      type: String,
      enum: ['contact', 'deal']
    },
    id: mongoose.Schema.Types.ObjectId
  },
  
  // Lifecycle Dates
  firstContactAt: Date,
  lastContactAt: Date,
  qualificationAt: Date,
  
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
leadSchema.index({ tenant: 1, status: 1 });
leadSchema.index({ tenant: 1, aiScore: -1 });
leadSchema.index({ tenant: 1, createdAt: -1 });
leadSchema.index({ tenant: 1, assignedTo: 1 });
leadSchema.index({ email: 1, tenant: 1 });
leadSchema.index({ phone: 1, tenant: 1 });
leadSchema.index({ company: 1, tenant: 1 });
leadSchema.index({ tags: 1 });
leadSchema.index({ deletedAt: 1 });

// Virtual for time since created
leadSchema.virtual('daysSinceCreated').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for full location string
leadSchema.virtual('fullLocation').get(function() {
  if (!this.location) return null;
  const parts = [this.location.city, this.location.state, this.location.country].filter(Boolean);
  return parts.join(', ');
});

// Pre-save hook for AI scoring
leadSchema.pre('save', async function(next) {
  if (this.isModified('email') || this.isModified('phone') || 
      this.isModified('source') || this.isModified('status') || 
      this.isModified('name')) {
    await this.calculateAIScore();
  }
  next();
});

// AI Scoring Method
leadSchema.methods.calculateAIScore = function() {
  let score = 0;
  const factors = [];
  
  // Email scoring (15 points)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (this.email && emailRegex.test(this.email)) {
    score += 15;
    factors.push({ name: 'Valid Email', points: 15, icon: '📧', description: 'Email format is valid' });
  } else if (this.email) {
    factors.push({ name: 'Invalid Email', points: 0, icon: '❌', description: 'Email format is invalid' });
  }
  
  // Phone scoring (10 points)
  if (this.phone && this.phone.length >= 10) {
    score += 10;
    factors.push({ name: 'Phone Provided', points: 10, icon: '📞', description: 'Phone number available' });
  }
  
  // Source scoring
  const sourceScores = {
    referral: 25,
    website: 15,
    ads: 10,
    social: 12,
    email: 20,
    event: 18,
    partner: 22,
    other: 5
  };
  const sourceScore = sourceScores[this.source] || 5;
  score += sourceScore;
  factors.push({ name: `${this.source} Source`, points: sourceScore, icon: '🎯', description: `Lead from ${this.source}` });
  
  // Status scoring
  const statusScores = {
    qualified: 30,
    proposal: 25,
    negotiation: 20,
    contacted: 15,
    new: 10,
    won: 35,
    lost: -10
  };
  const statusScore = statusScores[this.status] || 0;
  score += statusScore;
  factors.push({ name: `${this.status} Status`, points: statusScore, icon: '📊', description: `Current status: ${this.status}` });
  
  // Company scoring (10 points)
  if (this.company) {
    score += 10;
    factors.push({ name: 'Company Listed', points: 10, icon: '🏢', description: 'Company information available' });
  }
  
  // Job title scoring (5 points)
  if (this.jobTitle) {
    score += 5;
    factors.push({ name: 'Job Title Listed', points: 5, icon: '💼', description: 'Job title available' });
  }
  
  // Recency bonus (10 points if created within 7 days)
  const daysSinceCreation = Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
  if (daysSinceCreation <= 7) {
    score += 10;
    factors.push({ name: 'Recent Lead', points: 10, icon: '🆕', description: 'Created within 7 days' });
  }
  
  // Engagement bonus
  const engagementScore = Math.min(15, (this.engagement.emailsOpened * 1) + 
                                          (this.engagement.emailsClicked * 2) + 
                                          (this.engagement.callsConnected * 3));
  if (engagementScore > 0) {
    score += engagementScore;
    factors.push({ name: 'Engagement', points: Math.min(15, engagementScore), icon: '📈', description: 'Lead has engagement history' });
  }
  
  // Priority bonus
  const priorityScores = { urgent: 10, high: 7, medium: 5, low: 2 };
  score += priorityScores[this.priority] || 0;
  
  // Cap score between 0-100
  score = Math.max(0, Math.min(100, score));
  
  // Determine grade
  let grade = 'cold';
  if (score >= 80) grade = 'hot';
  else if (score >= 60) grade = 'warm';
  else if (score >= 40) grade = 'cool';
  
  // Calculate conversion probability
  const conversionProbability = score / 100;
  
  // Generate prediction
  let prediction = '';
  let nextBestStep = '';
  
  if (score >= 80) {
    prediction = 'High conversion probability. Prioritize follow-up.';
    nextBestStep = 'Schedule a demo call within 24 hours';
  } else if (score >= 60) {
    prediction = 'Good potential. Regular nurturing recommended.';
    nextBestStep = 'Send personalized follow-up email';
  } else if (score >= 40) {
    prediction = 'Moderate interest. Consider engagement campaigns.';
    nextBestStep = 'Add to nurturing email sequence';
  } else {
    prediction = 'Low engagement. May need re-evaluation or reactivation.';
    nextBestStep = 'Research and prepare re-engagement strategy';
  }
  
  // Update AI fields
  this.aiScore = score;
  this.aiGrade = grade;
  this.aiPrediction = {
    conversionProbability,
    recommendedAction: prediction,
    nextBestStep,
    keywords: [],
    sentiment: 'neutral'
  };
  this.aiFactors = factors;
  this.aiAnalyzedAt = new Date();
  
  // Add to score history
  this.scoreHistory.push({
    score,
    grade,
    factors,
    analyzedAt: new Date()
  });
  
  // Keep only last 50 score history entries
  if (this.scoreHistory.length > 50) {
    this.scoreHistory = this.scoreHistory.slice(-50);
  }
};

// Static method for query helpers
leadSchema.statics.findByTenant = function(tenantId, options = {}) {
  const query = this.find({ 
    tenant: tenantId,
    deletedAt: null 
  });
  
  if (options.status) query.where('status', options.status);
  if (options.assignedTo) query.where('assignedTo', options.assignedTo);
  if (options.minScore) query.where('aiScore').gte(options.minScore);
  if (options.source) query.where('source', options.source);
  if (options.tags && options.tags.length) query.where('tags').in(options.tags);
  
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

// Static method for pipeline aggregations
leadSchema.statics.getPipelineByTenant = function(tenantId) {
  return [
    { $match: { tenant: new mongoose.Types.ObjectId(tenantId), deletedAt: null } },
    { $group: {
      _id: '$status',
      count: { $sum: 1 },
      avgScore: { $avg: '$aiScore' },
      totalEngagement: { $sum: '$engagement.emailsOpened' }
    }},
    { $sort: { count: -1 } }
  ];
};

module.exports = mongoose.model('Lead', leadSchema);
