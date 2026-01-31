const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { requireTenant } = require('../middleware/tenant');
const Tenant = require('../models/Tenant');

// Note: Stripe integration would require actual Stripe API calls
// This is a simplified version for the CRM structure

// Plans configuration
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    interval: 'month',
    limits: { users: 1, leads: 100, contacts: 500, deals: 50, storage: 1073741824 },
    features: { aiInsights: true, advancedAnalytics: false, customBranding: false, apiAccess: false, whiteLabel: false }
  },
  starter: {
    name: 'Starter',
    price: 29,
    interval: 'month',
    limits: { users: 3, leads: 500, contacts: 2000, deals: 200, storage: 5368709120 },
    features: { aiInsights: true, advancedAnalytics: true, customBranding: false, apiAccess: false, whiteLabel: false }
  },
  pro: {
    name: 'Pro',
    price: 79,
    interval: 'month',
    limits: { users: 10, leads: 2000, contacts: 10000, deals: 1000, storage: 21474836480 },
    features: { aiInsights: true, advancedAnalytics: true, customBranding: true, apiAccess: true, whiteLabel: false }
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    interval: 'month',
    limits: { users: -1, leads: -1, contacts: -1, deals: -1, storage: -1 },
    features: { aiInsights: true, advancedAnalytics: true, customBranding: true, apiAccess: true, whiteLabel: true }
  }
};

// Get current subscription
router.get('/subscription', authenticate, requireTenant, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    
    res.json({
      subscription: {
        plan: tenant.plan,
        status: tenant.status,
        currentPeriodEnd: tenant.subscription?.currentPeriodEnd,
        cancelAtPeriodEnd: tenant.subscription?.cancelAtPeriodEnd,
        limits: tenant.limits,
        features: tenant.features
      },
      planDetails: PLANS[tenant.plan]
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Get available plans
router.get('/plans', authenticate, async (req, res) => {
  try {
    res.json({
      plans: Object.entries(PLANS).map(([key, plan]) => ({
        id: key,
        ...plan,
        features: Object.entries(plan.features).map(([feature, enabled]) => ({
          name: feature,
          enabled
        }))
      }))
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Create checkout session (Stripe placeholder)
router.post('/checkout', authenticate, requireTenant, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const { planId } = req.body;

    if (!PLANS[planId]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const tenant = await Tenant.findById(req.tenantId);

    // In production, create Stripe checkout session
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const session = await stripe.checkout.sessions.create({...});

    res.json({
      message: 'Checkout session created',
      planId,
      amount: PLANS[planId].price,
      // debug info for development
      debug: {
        checkoutUrl: `/checkout/${planId}`,
        note: 'Integrate with Stripe for actual payments'
      }
    });
  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Cancel subscription
router.post('/cancel', authenticate, requireTenant, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);

    if (!tenant.subscription?.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    // In production, cancel in Stripe
    // await stripe.subscriptions.update(tenant.subscription.stripeSubscriptionId, { cancel_at_period_end: true });

    tenant.subscription.cancelAtPeriodEnd = true;
    await tenant.save();

    res.json({
      message: 'Subscription will be cancelled at period end',
      currentPeriodEnd: tenant.subscription.currentPeriodEnd
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Resume subscription
router.post('/resume', authenticate, requireTenant, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);

    if (!tenant.subscription?.stripeSubscriptionId || !tenant.subscription.cancelAtPeriodEnd) {
      return res.status(400).json({ error: 'No subscription to resume' });
    }

    // In production, resume in Stripe
    // await stripe.subscriptions.update(tenant.subscription.stripeSubscriptionId, { cancel_at_period_end: false });

    tenant.subscription.cancelAtPeriodEnd = false;
    await tenant.save();

    res.json({ message: 'Subscription resumed' });
  } catch (error) {
    console.error('Resume subscription error:', error);
    res.status(500).json({ error: 'Failed to resume subscription' });
  }
});

// Get invoices
router.get('/invoices', authenticate, requireTenant, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);

    // In production, fetch from Stripe
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const invoices = await stripe.invoices.list({ customer: tenant.subscription.stripeCustomerId });

    res.json({
      invoices: [
        {
          id: 'inv_demo_1',
          amount: 7900,
          currency: 'usd',
          status: 'paid',
          created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          invoicePdf: '#'
        }
      ]
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Update payment method
router.post('/payment-method', authenticate, requireTenant, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const tenant = await Tenant.findById(req.tenantId);

    // In production, update in Stripe
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // await stripe.paymentMethods.attach(paymentMethodId, { customer: tenant.subscription.stripeCustomerId });
    // await stripe.customers.update(tenant.subscription.stripeCustomerId, { invoice_settings: { default_payment_method: paymentMethodId } });

    res.json({ message: 'Payment method updated' });
  } catch (error) {
    console.error('Update payment method error:', error);
    res.status(500).json({ error: 'Failed to update payment method' });
  }
});

module.exports = router;
