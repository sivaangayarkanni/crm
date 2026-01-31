const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Contact = require('../models/Contact');
const { authenticate, requirePermission } = require('../middleware/auth');
const { requireTenant } = require('../middleware/tenant');

// Validation schema
const contactSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  email: Joi.string().email().allow(''),
  phone: Joi.string().allow(''),
  mobile: Joi.string().allow(''),
  company: Joi.string().max(200).allow(''),
  jobTitle: Joi.string().max(100).allow(''),
  department: Joi.string().allow(''),
  type: Joi.string().valid('customer', 'prospect', 'partner', 'vendor', 'other').default('prospect'),
  address: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    postalCode: Joi.string(),
    country: Joi.string()
  }),
  social: Joi.object({
    linkedin: Joi.string().uri().allow(''),
    twitter: Joi.string().allow(''),
    facebook: Joi.string().uri().allow(''),
    instagram: Joi.string().allow('')
  }),
  tags: Joi.array().items(Joi.string())
});

// Get all contacts
router.get('/', authenticate, requireTenant, requirePermission('contacts', 'read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      company,
      tags,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      type,
      company,
      tags: tags ? tags.split(',') : undefined,
      search,
      sortBy,
      sortOrder
    };

    const contacts = await Contact.findByTenant(req.tenantId, options);

    res.json({
      contacts: contacts.map(c => ({
        id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        mobile: c.mobile,
        company: c.company,
        jobTitle: c.jobTitle,
        type: c.type,
        status: c.status,
        tags: c.tags,
        engagementScore: c.engagementScore,
        lastContactAt: c.engagement.lastContactAt,
        createdAt: c.createdAt
      })),
      pagination: {
        page: options.page,
        limit: options.limit,
        total: await Contact.countDocuments({ tenant: req.tenantId, deletedAt: null }),
        pages: Math.ceil(await Contact.countDocuments({ tenant: req.tenantId, deletedAt: null }) / options.limit)
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Get single contact
router.get('/:id', authenticate, requireTenant, requirePermission('contacts', 'read'), async (req, res) => {
  try {
    const contact = await Contact.findOne({ 
      _id: req.params.id, 
      tenant: req.tenantId,
      deletedAt: null 
    }).populate('leads', 'name status aiScore')
      .populate('deals', 'title value stage status');

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ contact });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// Create contact
router.post('/', authenticate, requireTenant, requirePermission('contacts', 'create'), async (req, res) => {
  try {
    const { error, value } = contactSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Validation error', details: error.details });
    }

    const contact = new Contact({
      ...value,
      tenant: req.tenantId,
      createdBy: req.user._id,
      source: 'manual'
    });

    await contact.save();

    res.status(201).json({
      message: 'Contact created successfully',
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        type: contact.type,
        createdAt: contact.createdAt
      }
    });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Failed to create contact', message: error.message });
  }
});

// Update contact
router.patch('/:id', authenticate, requireTenant, requirePermission('contacts', 'update'), async (req, res) => {
  try {
    const contact = await Contact.findOne({ 
      _id: req.params.id, 
      tenant: req.tenantId,
      deletedAt: null 
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const allowedFields = ['name', 'email', 'phone', 'mobile', 'company', 'jobTitle', 
                          'department', 'type', 'address', 'social', 'tags', 'status'];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        contact[field] = req.body[field];
      }
    }

    await contact.save();

    res.json({
      message: 'Contact updated',
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        company: contact.company,
        type: contact.type,
        updatedAt: contact.updatedAt
      }
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// Delete contact
router.delete('/:id', authenticate, requireTenant, requirePermission('contacts', 'delete'), async (req, res) => {
  try {
    const contact = await Contact.findOne({ 
      _id: req.params.id, 
      tenant: req.tenantId,
      deletedAt: null 
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    contact.deletedAt = new Date();
    contact.deletedBy = req.user._id;
    await contact.save();

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// Import contacts
router.post('/import', authenticate, requireTenant, requirePermission('contacts', 'create'), async (req, res) => {
  try {
    const { contacts: contactsData } = req.body;

    if (!Array.isArray(contactsData) || contactsData.length === 0) {
      return res.status(400).json({ error: 'Contacts array required' });
    }

    const contacts = contactsData.map(c => ({
      ...c,
      tenant: req.tenantId,
      createdBy: req.user._id,
      source: 'import',
      importedFrom: 'api'
    }));

    const result = await Contact.insertMany(contacts, { ordered: false });

    res.status(201).json({
      message: `Successfully imported ${result.length} contacts`,
      imported: result.length
    });
  } catch (error) {
    console.error('Import contacts error:', error);
    res.status(500).json({ error: 'Failed to import contacts' });
  }
});

module.exports = router;
