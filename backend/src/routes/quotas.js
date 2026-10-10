/**
 * Quota Metrics Router
 * GET /api/v1/quotas - Lists quotas with filtering and pagination
 * Quota Management and Increase Request Planning Control Plane
 */

const express = require('express');
const { db } = require('../db');

const router = express.Router();

// GET /api/v1/quotas
router.get('/', async (req, res) => {
  try {
    const {
      project_id,
      threshold,
      search,
      limit = '50',
      offset = '0',
    } = req.query;

    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);
    const parsedThreshold = threshold !== undefined ? parseFloat(threshold) : null;

    let allQuotas = await db.quota_metrics.findMany();

    // Filter by project_id
    if (project_id) {
      allQuotas = allQuotas.filter((q) => q.project_id === project_id);
    }

    // Filter by threshold (utilization_percentage >= threshold)
    if (parsedThreshold !== null && !isNaN(parsedThreshold)) {
      allQuotas = allQuotas.filter((q) => q.utilization_percentage >= parsedThreshold);
    }

    // Optional search by metric_name or region
    if (search) {
      const q = search.toLowerCase();
      allQuotas = allQuotas.filter(
        (m) =>
          m.metric_name.toLowerCase().includes(q) ||
          m.region.toLowerCase().includes(q)
      );
    }

    const total = allQuotas.length;
    const paginated = allQuotas.slice(parsedOffset, parsedOffset + parsedLimit);

    return res.status(200).json({
      success: true,
      data: paginated,
      pagination: {
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < total,
      },
    });
  } catch (error) {
    console.error('[QUOTAS ROUTE ERROR]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve quota metrics',
      message: error.message,
    });
  }
});

// POST /api/v1/quotas/sync
const QuotaService = require('../services/quota_service');
router.post('/sync', async (req, res) => {
  try {
    const { gcp_project_id = 'enterprise-prod-finance-42', region = 'us-central1' } = req.body;
    const result = await QuotaService.syncQuotaLimits(gcp_project_id, region);
    return res.status(200).json({
      success: true,
      message: `Quota sync completed successfully for ${gcp_project_id} (${region})`,
      data: result,
    });
  } catch (error) {
    console.error('[QUOTA SYNC ERROR]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to synchronize quota limits with Google Cloud Quotas API',
      message: error.message,
    });
  }
});

// GET /api/v1/quotas/:id
router.get('/:id', async (req, res) => {
  try {
    const quota = await db.quota_metrics.findUnique({
      where: { id: req.params.id },
    });

    if (!quota) {
      return res.status(404).json({
        success: false,
        error: 'Quota metric not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: quota,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve quota metric',
      message: error.message,
    });
  }
});

// GET /api/v1/quotas/:id/trends
router.get('/:id/trends', async (req, res) => {

  try {
    const quota = await db.quota_metrics.findUnique({
      where: { id: req.params.id },
    });

    if (!quota) {
      return res.status(404).json({
        success: false,
        error: 'Quota metric not found',
      });
    }

    const { days = '30' } = req.query;
    const windowDays = Math.max(1, Math.min(365, parseInt(days, 10) || 30));
    const observations = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // Generate historical points leading up to current_usage
    const baselineUsage = Math.max(0, quota.current_usage * 0.7);
    const dailyGrowth = (quota.current_usage - baselineUsage) / windowDays;

    for (let i = windowDays; i >= 0; i--) {
      const timestamp = new Date(now - i * dayMs).toISOString();
      const usage = parseFloat((baselineUsage + (windowDays - i) * dailyGrowth).toFixed(2));
      observations.push({
        timestamp,
        usage,
        utilization_percentage: parseFloat(((usage / quota.quota_limit) * 100).toFixed(2)),
      });
    }

    const burnRatePercentPerDay = parseFloat(((dailyGrowth / quota.quota_limit) * 100).toFixed(2));

    return res.status(200).json({
      success: true,
      quota_metric_id: quota.id,
      metric_name: quota.metric_name,
      window_days: windowDays,
      burn_rate_daily_percent: burnRatePercentPerDay,
      observations_count: observations.length,
      observations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate trend analytics',
      message: error.message,
    });
  }
});

// GET /api/v1/quotas/:id/forecast
const ForecastingService = require('../services/forecasting_service');
router.get('/:id/forecast', async (req, res) => {

  try {
    const quota = await db.quota_metrics.findUnique({
      where: { id: req.params.id },
    });

    if (!quota) {
      return res.status(404).json({
        success: false,
        error: 'Quota metric not found',
      });
    }

    const { horizon_days = '30', daily_burn_rate } = req.query;
    const horizon = Math.max(1, Math.min(180, parseInt(horizon_days, 10) || 30));
    const burnRate = daily_burn_rate !== undefined ? parseFloat(daily_burn_rate) : null;

    const forecast = ForecastingService.forecastDemand({
      currentUsage: quota.current_usage,
      quotaLimit: quota.quota_limit,
      dailyBurnRate: burnRate,
      horizonDays: horizon,
    });

    return res.status(200).json({
      success: true,
      quota_metric_id: quota.id,
      metric_name: quota.metric_name,
      region: quota.region,
      data: forecast,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate demand forecast',
      message: error.message,
    });
  }
});

module.exports = router;



