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

// Audit log for export tracking
const exportAuditLogs = [];

function classifyRisk(utilization) {
  if (utilization >= 90) return 'CRITICAL';
  if (utilization >= 80) return 'HIGH';
  if (utilization >= 60) return 'MODERATE';
  return 'NORMAL';
}

function filterQuotaList(quotas, { project_id, service, risk_level }) {
  let list = [...quotas];
  if (project_id) {
    list = list.filter((q) => q.project_id === project_id);
  }
  if (service) {
    list = list.filter((q) => q.metric_name.toLowerCase().includes(service.toLowerCase()));
  }
  if (risk_level) {
    const targetRisk = risk_level.toUpperCase();
    list = list.filter((q) => classifyRisk(q.utilization_percentage) === targetRisk);
  }
  return list;
}

// GET /api/v1/quotas/export/csv - Export Quota Telemetry as CSV
router.get('/export/csv', async (req, res) => {
  try {
    const { project_id, service, risk_level } = req.query;
    let quotas = await db.quota_metrics.findMany();
    quotas = filterQuotaList(quotas, { project_id, service, risk_level });

    const auditEntry = {
      format: 'CSV',
      timestamp: new Date().toISOString(),
      record_count: quotas.length,
      filters: { project_id, service, risk_level },
    };
    exportAuditLogs.push(auditEntry);
    console.log(`[AUDIT EXPORT] Download initiated: CSV format, ${quotas.length} records. Filters:`, auditEntry.filters);

    const headers = ['Metric Name', 'Region', 'Current Usage', 'Quota Limit', 'Utilization %', 'Risk Classification'];
    const rows = quotas.map((q) => {
      const risk = classifyRisk(q.utilization_percentage);
      return [
        `"${q.metric_name}"`,
        `"${q.region}"`,
        q.current_usage,
        q.quota_limit,
        `${q.utilization_percentage}%`,
        `"${risk}"`,
      ].join(',');
    });

    const csvData = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="gcp_quota_governance_report.csv"');
    return res.status(200).send(csvData);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate CSV report',
      message: error.message,
    });
  }
});

// GET /api/v1/quotas/export/json - Export Quota Telemetry as JSON with metadata
router.get('/export/json', async (req, res) => {
  try {
    const { project_id, service, risk_level } = req.query;
    let quotas = await db.quota_metrics.findMany();
    quotas = filterQuotaList(quotas, { project_id, service, risk_level });

    const auditEntry = {
      format: 'JSON',
      timestamp: new Date().toISOString(),
      record_count: quotas.length,
      filters: { project_id, service, risk_level },
    };
    exportAuditLogs.push(auditEntry);
    console.log(`[AUDIT EXPORT] Download initiated: JSON format, ${quotas.length} records.`);

    return res.status(200).json({
      success: true,
      metadata: {
        export_timestamp: new Date().toISOString(),
        governance_system: 'Google Cloud Quota Control Plane',
        filters_applied: { project_id: project_id || 'all', service: service || 'all', risk_level: risk_level || 'all' },
        total_records: quotas.length,
      },
      data: quotas.map((q) => ({
        ...q,
        risk_classification: classifyRisk(q.utilization_percentage),
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate JSON export',
      message: error.message,
    });
  }
});

// GET /api/v1/quotas/export/summary - Executive Summary Report
router.get('/export/summary', async (req, res) => {
  try {
    const quotas = await db.quota_metrics.findMany();
    const critical = quotas.filter((q) => q.utilization_percentage >= 90);
    const high = quotas.filter((q) => q.utilization_percentage >= 80 && q.utilization_percentage < 90);
    const moderate = quotas.filter((q) => q.utilization_percentage >= 60 && q.utilization_percentage < 80);
    const normal = quotas.filter((q) => q.utilization_percentage < 60);

    const avgUtilization = quotas.length > 0
      ? (quotas.reduce((acc, q) => acc + q.utilization_percentage, 0) / quotas.length).toFixed(1)
      : '0.0';

    return res.status(200).json({
      success: true,
      report_title: 'Google Cloud Quotas Executive Governance Summary',
      generated_at: new Date().toISOString(),
      metrics_summary: {
        total_quotas_monitored: quotas.length,
        average_utilization_pct: parseFloat(avgUtilization),
        risk_breakdown: {
          critical: critical.length,
          high: high.length,
          moderate: moderate.length,
          normal: normal.length,
        },
      },
      actionable_recommendations: critical.map((c) => ({
        metric_name: c.metric_name,
        region: c.region,
        current_utilization: `${c.utilization_percentage}%`,
        recommendation: `Immediate quota increase required: current limit ${c.quota_limit} is nearing exhaustion (${c.current_usage} used).`,
      })),
      audit_export_history_count: exportAuditLogs.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate executive summary report',
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

// GET /api/v1/quotas/:id/recommendation

const RecommendationService = require('../services/recommendation_service');
router.get('/:id/recommendation', async (req, res) => {
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

    const { safety_margin_pct = '25', growth_units = '0' } = req.query;
    const safetyMargin = Math.max(5, Math.min(100, parseFloat(safety_margin_pct) || 25));
    const growth = Math.max(0, parseFloat(growth_units) || 0);

    const recommendation = RecommendationService.generateRecommendation({
      currentLimit: quota.quota_limit,
      currentUsage: quota.current_usage,
      safetyMarginPct: safetyMargin,
      projectedGrowthUnits: growth,
    });

    return res.status(200).json({
      success: true,
      quota_metric_id: quota.id,
      metric_name: quota.metric_name,
      region: quota.region,
      data: recommendation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate recommendation',
      message: error.message,
    });
  }
});

module.exports = router;




