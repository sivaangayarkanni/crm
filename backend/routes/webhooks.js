const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const Lead = require('../models/Lead');

// Stripe webhooks (placeholder - would need actual Stripe signature verification)
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const event = req.body;

  // In production, verify webhook signature
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const sig = req.headers['stripe-signature'];
  // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  // let stripeEvent;
  // try {
  //   stripeEvent = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  // } catch (err) {
  //   return res.status(`Webhook Error:(400).send ${err.message}`);
  // }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        const tenant = await Tenant.findOne({ 'subscription.stripeCustomerId': customerId });
        if (tenant) {
          tenant.subscription.stripeSubscriptionId = subscription.id;
          tenant.subscription.status = subscription.status;
          tenant.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          tenant.subscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
          
          // Update plan based on subscription
          // In production, map subscription price ID to plan
          tenant.plan = 'pro';
          
          await tenant.save();
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        const deletedCustomerId = deletedSubscription.customer;
        
        const deletedTenant = await Tenant.findOne({ 'subscription.stripeCustomerId': deletedCustomerId });
        if (deletedTenant) {
          deletedTenant.plan = 'free';
          deletedTenant.status = 'cancelled';
          deletedTenant.subscription.stripeSubscriptionId = null;
          await deletedTenant.save();
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        const invoiceCustomerId = invoice.customer;
        
        const invoiceTenant = await Tenant.findOne({ 'subscription.stripeCustomerId': invoiceCustomerId });
        if (invoiceTenant) {
          // Update payment history, send receipt, etc.
          console.log(`Payment succeeded for tenant ${invoiceTenant._id}`);
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        const failedCustomerId = failedInvoice.customer;
        
        const failedTenant = await Tenant.findOne({ 'subscription.stripeCustomerId': failedCustomerId });
        if (failedTenant) {
          // Send notification, alert user, etc.
          console.log(`Payment failed for tenant ${failedTenant._id}`);
        }
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook handler failed' });
  }
});

// Lead capture webhook (for external forms)
router.post('/lead-capture', async (req, res) => {
  try {
    const { tenantSlug, source, name, email, phone, company, metadata } = req.body;

    if (!tenantSlug || !name) {
      return res.status(400).json({ error: 'Tenant slug and name required' });
    }

    const tenant = await Tenant.findOne({ slug: tenantSlug, status: { $ne: 'cancelled' } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Create lead from webhook data
    const lead = new Lead({
      tenant: tenant._id,
      name,
      email,
      phone,
      company,
      source: source || 'website',
      status: 'new',
      priority: 'medium',
      metadata: metadata || {},
      // Default values for webhook leads
      createdBy: tenant.owner // Use owner as default creator
    });

    await lead.save();

    // Emit real-time notification
    const io = req.app?.get('io');
    if (io) {
      io.to(`tenant:${tenant._id}`).emit('notification', {
        type: 'new_lead',
        message: `New lead captured: ${name}`,
        leadId: lead._id
      });
    }

    res.status(201).json({
      message: 'Lead captured successfully',
      leadId: lead._id
    });
  } catch (error) {
    console.error('Lead capture webhook error:', error);
    res.status(500).json({ error: 'Failed to capture lead' });
  }
});

// Generic webhook handler for integrations
router.post('/generic/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { event, data } = req.body;

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Process custom webhook events
    // This could be extended to support various third-party integrations
    
    console.log(`Webhook event ${event} for tenant ${tenantId}`);

    res.json({ received: true, event, tenantId });
  } catch (error) {
    console.error('Generic webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

module.exports = router;
