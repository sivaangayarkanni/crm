const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Deal = require('../models/Deal');
const User = require('../models/User');
const { authenticate, requirePermission } = require('../middleware/auth');
const { requireTenant } = require('../middleware/tenant');

// Get dashboard analytics
router.get('/dashboard', authenticate, requireTenant, requirePermission('analytics', 'view'), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Lead stats
    const leadStats = await Lead.aggregate([
      { $match: { tenant: tenantId, deletedAt: null } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
        qualified: { $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] } },
        converted: { $sum: { $cond: ['$converted', 1, 0] } },
        avgScore: { $avg: '$aiScore' },
        hotLeads: { $sum: { $cond: [{ $eq: ['$aiGrade', 'hot'] }, 1, 0] } }
      }}
    ]);

    // Deal stats
    const dealStats = await Deal.aggregate([
      { $match: { tenant: tenantId, deletedAt: null } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
        won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
        lost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
        totalValue: { $sum: '$value' },
        weightedValue: { $sum: { $multiply: ['$value', { $divide: ['$probability', 100] }] } }
      }}
    ]);

    // Contact stats
    const contactStats = await Contact.aggregate([
      { $match: { tenant: tenantId, deletedAt: null } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        customers: { $sum: { $cond: [{ $eq: ['$type', 'customer'] }, 1, 0] } },
        prospects: { $sum: { $cond: [{ $eq: ['$type', 'prospect'] }, 1, 0] } }
      }}
    ]);

    // Leads by source
    const leadsBySource = await Lead.aggregate([
      { $match: { tenant: tenantId, deletedAt: null } },
      { $group: { _id: '$source', count: { $sum: 1 } }},
      { $sort: { count: -1 } }
    ]);

    // Leads by status
    const leadsByStatus = await Lead.aggregate([
      { $match: { tenant: tenantId, deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 }, avgScore: { $avg: '$aiScore' } }},
      { $sort: { count: -1 } }
    ]);

    // Pipeline by stage
    const pipelineByStage = await Deal.aggregate([
      { $match: { tenant: tenantId, status: 'open', deletedAt: null } },
      { $group: {
        _id: '$stage',
        count: { $sum: 1 },
        value: { $sum: '$value' },
        weightedValue: { $sum: { $multiply: ['$value', { $divide: ['$probability', 100] }] } }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Recent activity (last 30 days)
    const recentLeads = await Lead.countDocuments({
      tenant: tenantId,
      createdAt: { $gte: thirtyDaysAgo },
      deletedAt: null
    });

    // Conversion trends (monthly)
    const monthlyTrends = await Lead.aggregate([
      { $match: { tenant: tenantId, deletedAt: null } },
      { $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        total: { $sum: 1 },
        converted: { $sum: { $cond: ['$converted', 1, 0] } },
        avgScore: { $avg: '$aiScore' }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Top performers (users with most leads/deals)
    const topPerformers = await Lead.aggregate([
      { $match: { tenant: tenantId, deletedAt: null, assignedTo: { $ne: null } } },
      { $group: {
        _id: '$assignedTo',
        leadCount: { $sum: 1 },
        avgScore: { $avg: '$aiScore' }
      }},
      { $sort: { leadCount: -1 } },
      { $limit: 5 },
      { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }},
      { $unwind: '$user' },
      { $project: {
        userId: '$_id',
        name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
        leadCount: 1,
        avgScore: 1
      }}
    ]);

    res.json({
      summary: {
        leads: leadStats[0] || { total: 0, new: 0, qualified: 0, converted: 0, avgScore: 0, hotLeads: 0 },
        deals: dealStats[0] || { total: 0, open: 0, won: 0, lost: 0, totalValue: 0, weightedValue: 0 },
        contacts: contactStats[0] || { total: 0, customers: 0, prospects: 0 },
        recentActivity: {
          newLeads30Days: recentLeads
        }
      },
      charts: {
        leadsBySource,
        leadsByStatus,
        pipelineByStage,
        monthlyTrends,
        topPerformers
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get lead analytics
router.get('/leads', authenticate, requireTenant, requirePermission('analytics', 'view'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = { tenant: req.tenantId, deletedAt: null };
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const leadAnalytics = await Lead.aggregate([
      { $match: matchStage },
      {
        $facet: {
          // Distribution by score
          scoreDistribution: [
            { $bucket: {
              groupBy: '$aiScore',
              boundaries: [0, 20, 40, 60, 80, 100, 101],
              default: 'Other',
              output: { count: { $sum: 1 } }
            }}
          ],
          // Distribution by grade
          gradeDistribution: [
            { $group: { _id: '$aiGrade', count: { $sum: 1 } }}
          ],
          // Source performance
          sourcePerformance: [
            { $group: {
              _id: '$source',
              count: { $sum: 1 },
              avgScore: { $avg: '$aiScore' },
              converted: { $sum: { $cond: ['$converted', 1, 0] } }
            }},
            { $sort: { count: -1 } }
          ],
          // Status funnel
          statusFunnel: [
            { $group: {
              _id: '$status',
              count: { $sum: 1 },
              avgScore: { $avg: '$aiScore' }
            }}
          ],
          // Conversion by source
          conversionBySource: [
            { $match: { converted: true } },
            { $group: { _id: '$source', count: { $sum: 1 } }}
          ]
        }
      }
    ]);

    res.json({
      scoreDistribution: leadAnalytics[0].scoreDistribution,
      gradeDistribution: leadAnalytics[0].gradeDistribution,
      sourcePerformance: leadAnalytics[0].sourcePerformance,
      statusFunnel: leadAnalytics[0].statusFunnel,
      conversionBySource: leadAnalytics[0].conversionBySource
    });
  } catch (error) {
    console.error('Lead analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch lead analytics' });
  }
});

// Get deal analytics
router.get('/deals', authenticate, requireTenant, requirePermission('analytics', 'view'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = { tenant: req.tenantId, deletedAt: null };
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const dealAnalytics = await Deal.aggregate([
      { $match: matchStage },
      {
        $facet: {
          // Win/loss ratio
          winLoss: [
            { $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalValue: { $sum: '$value' }
            }}
          ],
          // Revenue by stage
          revenueByStage: [
            { $match: { status: 'won' } },
            { $group: {
              _id: '$stage',
              revenue: { $sum: '$value' },
              count: { $sum: 1 }
            }},
            { $sort: { revenue: -1 } }
          ],
          // Average deal size
          avgDealSize: [
            { $match: { status: 'won' } },
            { $group: {
              _id: null,
              avgValue: { $avg: '$value' },
              totalRevenue: { $sum: '$value' },
              count: { $sum: 1 }
            }}
          ],
          // Cycle time
          cycleTime: [
            { $match: { status: 'won' } },
            { $project: {
              cycleDays: {
                $divide: [
                  { $subtract: ['$actualCloseDate', '$createdAt'] },
                  1000 * 60 * 60 * 24
                ]
              },
              value: 1
            }},
            { $group: {
              _id: null,
              avgDays: { $avg: '$cycleDays' },
              minDays: { $min: '$cycleDays' },
              maxDays: { $max: '$cycleDays' }
            }}
          ],
          // Conversion rates by stage
          conversionByStage: [
            { $match: { status: { $in: ['won', 'lost'] } } },
            { $group: {
              _id: '$stage',
              total: { $sum: 1 },
              won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
              lost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } }
            }}
          ]
        }
      }
    ]);

    res.json({
      winLoss: dealAnalytics[0].winLoss,
      revenueByStage: dealAnalytics[0].revenueByStage,
      avgDealSize: dealAnalytics[0].avgDealSize[0] || { avgValue: 0, totalRevenue: 0, count: 0 },
      cycleTime: dealAnalytics[0].cycleTime[0] || { avgDays: 0, minDays: 0, maxDays: 0 },
      conversionByStage: dealAnalytics[0].conversionByStage
    });
  } catch (error) {
    console.error('Deal analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch deal analytics' });
  }
});

// Export analytics data
router.get('/export', authenticate, requireTenant, requirePermission('analytics', 'export'), async (req, res) => {
  try {
    const { type = 'all', format = 'json', startDate, endDate } = req.query;

    const matchStage = { tenant: req.tenantId, deletedAt: null };
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    let data = {};

    if (type === 'all' || type === 'leads') {
      data.leads = await Lead.find(matchStage).select('-notes -activities -scoreHistory').lean();
    }

    if (type === 'all' || type === 'deals') {
      data.deals = await Deal.find(matchStage).select('-notes -activities').lean();
    }

    if (type === 'all' || type === 'contacts') {
      data.contacts = await Contact.find(matchStage).select('-notes').lean();
    }

    if (format === 'csv') {
      // Convert to CSV format
      // This is a simplified version - actual implementation would be more robust
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${Date.now()}.csv`);
      return res.send(JSON.stringify(data));
    }

    res.json({ data, exportedAt: new Date() });
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ error: 'Failed to export analytics' });
  }
});

module.exports = router;
