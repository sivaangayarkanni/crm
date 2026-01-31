const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Deal = require('../models/Deal');
const { authenticate, requirePermission } = require('../middleware/auth');
const { requireTenant } = require('../middleware/tenant');

// Validation schema
const dealSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(5000).allow(''),
  value: Joi.number().min(0).required(),
  currency: Joi.string().default('USD'),
  pipeline: Joi.string().default('default'),
  stage: Joi.string().valid('qualification', 'discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost').default('qualification'),
  probability: Joi.number().min(0).max(100).default(10),
  expectedCloseDate: Joi.date().allow(null),
  contact: Joi.string().allow(null),
  lead: Joi.string().allow(null),
  company: Joi.string().max(200).allow(''),
  assignedTo: Joi.string().allow(null),
  tags: Joi.array().items(Joi.string()),
  lineItems: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    description: Joi.string(),
    quantity: Joi.number().min(1).default(1),
    unitPrice: Joi.number().min(0).required(),
    discount: Joi.number().min(0).default(0)
  }))
});

// Get all deals
router.get('/', authenticate, requireTenant, requirePermission('deals', 'read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      stage,
      assignedTo,
      contact,
      minValue,
      maxValue,
      pipeline,
      tags,
      search,
      sortBy = 'expectedCloseDate',
      sortOrder = 'asc'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      stage,
      assignedTo,
      contact,
      minValue: minValue ? parseFloat(minValue) : undefined,
      maxValue: maxValue ? parseFloat(maxValue) : undefined,
      pipeline,
      tags: tags ? tags.split(',') : undefined,
      search,
      sortBy,
      sortOrder
    };

    const deals = await Deal.findByTenant(req.tenantId, options);

    res.json({
      deals: deals.map(deal => ({
        id: deal._id,
        title: deal.title,
        value: deal.value,
        formattedValue: deal.formattedValue,
        currency: deal.currency,
        stage: deal.stage,
        status: deal.status,
        probability: deal.probability,
        dealScore: deal.dealScore,
        weightedValue: deal.weightedValue,
        expectedCloseDate: deal.expectedCloseDate,
        daysUntilClose: deal.daysUntilClose,
        contact: deal.contact,
        company: deal.company,
        assignedTo: deal.assignedTo,
        aiPrediction: deal.aiPrediction,
        tags: deal.tags,
        createdAt: deal.createdAt
      })),
      pagination: {
        page: options.page,
        limit: options.limit,
        total: await Deal.countDocuments({ tenant: req.tenantId, deletedAt: null }),
        pages: Math.ceil(await Deal.countDocuments({ tenant: req.tenantId, deletedAt: null }) / options.limit)
      }
    });
  } catch (error) {
    console.error('Get deals error:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// Get pipeline view
router.get('/pipeline', authenticate, requireTenant, requirePermission('deals', 'read'), async (req, res) => {
  try {
    const { pipeline = 'default' } = req.query;

    const stages = await Deal.getPipelineStats(req.tenantId);
    const pipelineData = await Deal.aggregate([
      { $match: { tenant: req.tenantId, status: 'open', pipeline, deletedAt: null } },
      { $group: {
        _id: '$stage',
        count: { $sum: 1 },
        totalValue: { $sum: '$value' },
        avgProbability: { $avg: '$probability' },
        deals: { 
          $push: {
            id: '$_id',
            title: '$title',
            value: '$value',
            probability: '$probability',
            expectedCloseDate: '$expectedCloseDate',
            assignedTo: '$assignedTo',
            contact: '$contact'
          }
        }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json({
      pipeline,
      stages: pipelineData.map(stage => ({
        id: stage._id,
        count: stage.count,
        totalValue: stage.totalValue,
        avgProbability: stage.avgProbability,
        deals: stage.deals.slice(0, 10) // Limit to 10 deals per stage
      }))
    });
  } catch (error) {
    console.error('Get pipeline error:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline' });
  }
});

// Get single deal
router.get('/:id', authenticate, requireTenant, requirePermission('deals', 'read'), async (req, res) => {
  try {
    const deal = await Deal.findOne({ 
      _id: req.params.id, 
      tenant: req.tenantId,
      deletedAt: null 
    }).populate('assignedTo', 'username firstName lastName email avatar')
      .populate('contact', 'name email company phone')
      .populate('lead', 'name email aiScore aiGrade')
      .populate('activities.createdBy', 'username firstName lastName')
      .populate('notes.createdBy', 'username firstName lastName');

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    res.json({ deal });
  } catch (error) {
    console.error('Get deal error:', error);
    res.status(500).json({ error: 'Failed to fetch deal' });
  }
});

// Create deal
router.post('/', authenticate, requireTenant, requirePermission('deals', 'create'), async (req, res) => {
  try {
    const { error, value } = dealSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Validation error', details: error.details });
    }

    // Calculate line items total
    if (value.lineItems && value.lineItems.length > 0) {
      value.lineItems = value.lineItems.map(item => ({
        ...item,
        total: (item.quantity || 1) * item.unitPrice * (1 - (item.discount || 0) / 100)
      }));
    }

    const deal = new Deal({
      ...value,
      tenant: req.tenantId,
      createdBy: req.user._id,
      assignedTo: value.assignedTo || req.user._id
    });

    await deal.save();

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`tenant:${req.tenantId}`).emit('deal:created', {
        deal: { id: deal._id, title: deal.title, value: deal.value }
      });
    }

    res.status(201).json({
      message: 'Deal created successfully',
      deal: {
        id: deal._id,
        title: deal.title,
        value: deal.value,
        stage: deal.stage,
        dealScore: deal.dealScore,
        createdAt: deal.createdAt
      }
    });
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({ error: 'Failed to create deal', message: error.message });
  }
});

// Update deal
router.patch('/:id', authenticate, requireTenant, requirePermission('deals', 'update'), async (req, res) => {
  try {
    const deal = await Deal.findOne({ 
      _id: req.params.id, 
      tenant: req.tenantId,
      deletedAt: null 
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const allowedFields = ['title', 'description', 'value', 'currency', 'stage', 'probability',
                          'expectedCloseDate', 'contact', 'lead', 'company', 'assignedTo', 'tags', 'status'];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        deal[field] = req.body[field];
      }
    }

    // Handle stage change
    if (req.body.stage) {
      const previousStage = deal._previousValues?.stage;
      if (previousStage !== req.body.stage) {
        deal.activities.push({
          type: 'change_stage',
          description: `Changed stage from ${previousStage} to ${req.body.stage}`,
          createdBy: req.user._id,
          completedAt: new Date()
        });
      }
    }

    // Handle closed status
    if (req.body.status === 'won' || req.body.status === 'lost') {
      deal.actualCloseDate = new Date();
    }

    await deal.save();

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`tenant:${req.tenantId}`).emit('deal:updated', {
        deal: { id: deal._id, title: deal.title, stage: deal.stage, value: deal.value }
      });
    }

    res.json({
      message: 'Deal updated',
      deal: {
        id: deal._id,
        title: deal.title,
        stage: deal.stage,
        value: deal.value,
        dealScore: deal.dealScore,
        aiPrediction: deal.aiPrediction,
        updatedAt: deal.updatedAt
      }
    });
  } catch (error) {
    console.error('Update deal error:', error);
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

// Update deal stage
router.patch('/:id/stage', authenticate, requireTenant, requirePermission('deals', 'update'), async (req, res) => {
  try {
    const { stage } = req.body;

    if (!['qualification', 'discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'].includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage' });
    }

    const deal = await Deal.findOne({ 
      _id: req.params.id, 
      tenant: req.tenantId,
      deletedAt: null 
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const previousStage = deal.stage;
    deal.stage = stage;
    deal.activities.push({
      type: 'change_stage',
      description: `Changed stage from ${previousStage} to ${stage}`,
      createdBy: req.user._id,
      completedAt: new Date()
    });

    // Set close date if closed
    if (stage === 'closed_won' || stage === 'closed_lost') {
      deal.status = stage === 'closed_won' ? 'won' : 'lost';
      deal.actualCloseDate = new Date();
      deal.probability = stage === 'closed_won' ? 100 : 0;
    }

    await deal.save();

    res.json({
      message: 'Stage updated',
      deal: {
        id: deal._id,
        stage: deal.stage,
        status: deal.status,
        updatedAt: deal.updatedAt
      }
    });
  } catch (error) {
    console.error('Update stage error:', error);
    res.status(500).json({ error: 'Failed to update stage' });
  }
});

// Add activity to deal
router.post('/:id/activities', authenticate, requireTenant, requirePermission('deals', 'update'), async (req, res) => {
  try {
    const { type, description, outcome, duration, scheduledAt } = req.body;

    const deal = await Deal.findOne({ 
      _id: req.params.id, 
      tenant: req.tenantId,
      deletedAt: null 
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    deal.activities.push({
      type,
      description,
      outcome,
      duration,
      scheduledAt: scheduledAt || new Date(),
      createdBy: req.user._id,
      completedAt: scheduledAt ? undefined : new Date()
    });

    deal.engagement.lastActivityAt = new Date();
    
    // Update engagement counters
    if (type === 'call') deal.engagement.callsMade += 1;
    if (type === 'email') deal.engagement.emailsSent += 1;
    if (type === 'meeting') deal.engagement.meetingsHeld += 1;
    if (type === 'proposal') deal.engagement.proposalsSent += 1;

    await deal.save();

    res.json({
      message: 'Activity added',
      activity: deal.activities[deal.activities.length - 1]
    });
  } catch (error) {
    console.error('Add activity error:', error);
    res.status(500).json({ error: 'Failed to add activity' });
  }
});

// Delete deal
router.delete('/:id', authenticate, requireTenant, requirePermission('deals', 'delete'), async (req, res) => {
  try {
    const deal = await Deal.findOne({ 
      _id: req.params.id, 
      tenant: req.tenantId,
      deletedAt: null 
    });

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    deal.deletedAt = new Date();
    deal.deletedBy = req.user._id;
    await deal.save();

    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Delete deal error:', error);
    res.status(500).json({ error: 'Failed to delete deal' });
  }
});

module.exports = router;
