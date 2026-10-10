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

module.exports = router;

