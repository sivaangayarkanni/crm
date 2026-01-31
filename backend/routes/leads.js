const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Lead = require('../models/Lead');
const { authenticate, requirePermission } = require('../middleware/auth');
const { requireTenant } = require('../middleware/tenant');

// Validation schema
const leadSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  email: Joi.string().email().allow(''),
  phone: Joi.string().allow(''),
  company: Joi.string().max(200).allow(''),
  jobTitle: Joi.string().max(100).allow(''),
  source: Joi.string().valid('website', 'referral', 'social', 'ads', 'email', 'event', 'partner', 'other').default('website'),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost').default('new'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  assignedTo: Joi.string().allow(null),
  tags: Joi.array().items(Joi.string()),
  location: Joi.object({
    country: Joi.string(),
    state: Joi.string(),
    city: Joi.string(),
    timezone: Joi.string()
  }),
  social: Joi.object({
    linkedin: Joi.string().uri().allow(''),
    twitter: Joi.string().allow(''),
    facebook: Joi.string().uri().allow('')
  }),
  notes: Joi.array().items(Joi.object({
    content: Joi.string().required(),
    type: Joi.string().valid('general', 'call', 'email', 'meeting', 'followup').default('general')
  })),
  customFields: Joi.object()
});

const updateLeadSchema = Joi.object({
  name: Joi.string().min(1).max(200),
  email: Joi.string().email().allow(''),
  phone: Joi.string().allow(''),
  company: Joi.string().max(200).allow(''),
  jobTitle: Joi.string().max(100).allow(''),
  source: Joi.string().valid('website', 'referral', 'social', 'ads', 'email', 'event', 'partner', 'other'),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  assignedTo: Joi.string().allow(null),
  tags: Joi.array().items(Joi.string()),
  location: Joi.object({
    country: Joi.string(),
    state: Joi.string(),
    city: Joi.string(),
    timezone: Joi.string()
  }),
  social: Joi.object({
    linkedin: Joi.string().uri().allow(''),
    twitter: Joi.string().allow(''),
    facebook: Joi.string().uri().allow('')
  })
});

// Get all leads
router.get('/', authenticate, requireTenant, requirePermission('leads', 'read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      source,
      assignedTo,
      minScore,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      source,
      assignedTo,
      minScore: minScore ? parseInt(minScore) : undefined,
      tags: tags ? tags.split(',') : undefined,
      sortBy,
      sortOrder,
      search
    };

    const leads = await Lead.findByTenant(req.tenantId, options);
    const total = await Lead.countDocuments({ tenant: req.tenantId, deletedAt: null });

    res.json({
      leads: leads.map(lead => ({
        id: lead._id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        jobTitle: lead.jobTitle,
        source: lead.source,
        status: lead.status,
        priority: lead.priority,
        aiScore: lead.aiScore,
        aiGrade: lead.aiGrade,
        aiPrediction: lead.aiPrediction,
        assignedTo: lead.assignedTo,
        tags: lead.tags,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt
      })),
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Get single lead
router.get('/:id', authenticate, requireTenant, requirePermission('leads', 'read'), async (req, res) => {
  try {
    const lead = await Lead.findOne({ 
      _id: req.params.id, 
      tenant: req.tenantId,
      deletedAt: null 
    }).populate('assignedTo', 'username firstName lastName email')
      .populate('createdBy', 'username firstName lastName');

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({
      lead: {
        id: lead._id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        jobTitle: lead.jobTitle,
        source: lead.source,
        sourceDetails: lead.sourceDetails,
        status: lead.status,
        priority: lead.priority,
        aiScore: lead.aiScore,
        aiGrade: lead.aiGrade,
        aiPrediction: lead.aiPrediction,
        aiFactors: lead.aiFactors,
        aiAnalyzedAt: lead.aiAnalyzedAt,
        scoreHistory: lead.scoreHistory,
        engagement: lead.engagement,
        assignedTo: lead.assignedTo,
        createdBy: lead.createdBy,
        tags: lead.tags,
        location: lead.location,
        social: lead.social,
        notes: lead.notes,
        converted: lead.converted,
        convertedAt: lead.convertedAt,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt
      }
    });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// Create lead
router.post('/', authenticate, requireTenant, requirePermission('leads', 'create'), async (req, res) => {
  try {
    const { error, value } = leadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Validation error', details: error.details });
    }

    const lead = new Lead({
      ...value,
      tenant: req.tenantId,
      createdBy: req.user._id,
      assignedTo: value.assignedTo || req.user._id
    });

    await lead.save();

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`tenant:${req.tenantId}`).emit('lead:created', {
        lead: {
          id: lead._id,
          name: lead.name,
          aiScore: lead.aiScore,
          aiGrade: lead.aiGrade
        }
      });
    }

    res.status(201).json({
      message: 'Lead created successfully',
      lead: {
        id: lead._id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        source: lead.source,
        status: lead.status,
        aiScore: lead.aiScore,
        aiGrade: lead.aiGrade,
        aiPrediction: lead.aiPrediction,
        createdAt: lead.createdAt
      }
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Failed to create lead', message: error.message });
  }
});

// Update lead
router.patch('/:id', authenticate, requireTenant, requirePermission('leads', 'update'), async (req, res) => {
  try {
    const { error, value } = updateLeadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Validation error', details: error.details });
    }

    const lead = await Lead.findOne({ 
      _id: req.params.id, 
      tenant: req.tenantId,
      deletedAt: null 
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Update fields
    Object.assign(lead, value);
    
    // Trigger AI score recalculation
    await lead.calculateAIScore();
    await lead.save();

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`tenant:${req.tenantId}`).emit('lead:updated', {
        lead: {
          id: lead._id,
          name: lead.name,
          status: lead.status,
          aiScore: lead.aiScore,
          aiGrade: lead.aiGrade
        }
      });
    }

    res.json({
      message: 'Lead updated successfully',
      lead: {
        id: lead._id,
        name: lead.name,
        status: lead.status,
        aiScore: lead.aiScore,
        aiGrade: lead.aiGrade,
        aiPrediction: lead.aiPrediction,
        updatedAt: lead.updatedAt
      }
    });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Update lead status
router.patch('/:id/status', authenticate, requireTenant, requirePermission('leads', 'update'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const lead = await Lead.findOne({ 
      _id: req.params.id, 
      tenant: req.tenantId,
      deletedAt: null 
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    lead.status = status;
    if (status === 'qualified') {
      lead.qualificationAt = new Date();
    }
    if (status === 'won' || status === 'lost') {
      lead.converted = true;
      lead.convertedAt = new Date();
    }
    
    await lead.calculateAIScore();
    await lead.save();

    res.json({
      message: 'Status updated',
      lead: {
        id: lead._id,
        status: lead.status,
        aiScore: lead.aiScore,
        aiGrade: lead.aiGrade
      }
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Add note to lead
router.post('/:id/notes', authenticate, requireTenant, requirePermission('leads', 'update'), async (req, res) => {
  try {
    const { content, type = 'general' } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const lead = await Lead.findOne({ 
      _id: req.params.id, 
      tenant: req.tenantId,
      deletedAt: null 
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    lead.notes.push({
      content,
      type,
      createdBy: req.user._id,
      createdAt: new Date()
    });

    await lead.save();

    res.json({
      message: 'Note added',
      note: lead.notes[lead.notes.length - 1]
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Delete lead (soft delete)
router.delete('/:id', authenticate, requireTenant, requirePermission('leads', 'delete'), async (req, res) => {
  try {
    const lead = await Lead.findOne({ 
      _id: req.params.id, 
      tenant: req.tenantId,
      deletedAt: null 
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    lead.deletedAt = new Date();
    lead.deletedBy = req.user._id;
    await lead.save();

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// Bulk update leads
router.post('/bulk', authenticate, requireTenant, requirePermission('leads', 'update'), async (req, res) => {
  try {
    const { leadIds, updates } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: 'Lead IDs required' });
    }

    const { error } = updateLeadSchema.validate(updates);
    if (error) {
      return res.status(400).json({ error: 'Validation error', details: error.details });
    }

    const result = await Lead.updateMany(
      { 
        _id: { $in: leadIds }, 
        tenant: req.tenantId,
        deletedAt: null 
      },
      { $set: updates }
    );

    res.json({
      message: `${result.modifiedCount} leads updated`
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to bulk update leads' });
  }
});

// Get AI insights for a lead
router.get('/:id/ai-insights', authenticate, requireTenant, requirePermission('leads', 'read'), async (req, res) => {
  try {
    const lead = await Lead.findOne({ 
      _id: req.params.id, 
      tenant: req.tenantId,
      deletedAt: null 
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({
      insights: {
        score: lead.aiScore,
        grade: lead.aiGrade,
        prediction: lead.aiPrediction,
        factors: lead.aiFactors,
        analyzedAt: lead.aiAnalyzedAt,
        scoreHistory: lead.scoreHistory.slice(-10)
      }
    });
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({ error: 'Failed to get AI insights' });
  }
});

module.exports = router;
