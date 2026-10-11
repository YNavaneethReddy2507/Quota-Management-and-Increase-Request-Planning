/**
 * Projects Router
 * GET /api/v1/projects - Lists all tracked GCP projects
 * Quota Management and Increase Request Planning Control Plane
 */

const express = require('express');
const { db } = require('../db');

const router = express.Router();

// GET /api/v1/projects
router.get('/', async (req, res) => {
  try {
    const projects = await db.projects.findMany();
    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error('[PROJECTS ROUTE ERROR]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve GCP projects',
      message: error.message,
    });
  }
});

// GET /api/v1/projects/summary/aggregate - Cross-project aggregated statistics
router.get('/summary/aggregate', async (req, res) => {
  try {
    const projects = await db.projects.findMany();
    const quotas = await db.quota_metrics.findMany();
    const requests = await db.increase_requests.findMany();

    const totalProjects = projects.length;
    const totalQuotas = quotas.length;
    const atRiskQuotas = quotas.filter((q) => q.utilization_percentage >= 80).length;
    const pendingRequests = requests.filter((r) => r.status === 'PENDING').length;

    const avgUtilization = totalQuotas > 0
      ? parseFloat((quotas.reduce((acc, q) => acc + q.utilization_percentage, 0) / totalQuotas).toFixed(2))
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalProjects,
        totalQuotas,
        atRiskQuotas,
        pendingRequests,
        averageUtilization: avgUtilization,
        projectsSummary: projects.map((p) => {
          const pQuotas = quotas.filter((q) => q.project_id === p.id);
          const pAtRisk = pQuotas.filter((q) => q.utilization_percentage >= 80).length;
          return {
            id: p.id,
            gcp_project_id: p.gcp_project_id,
            environment: p.environment,
            quotaCount: pQuotas.length,
            atRiskCount: pAtRisk,
          };
        }),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to aggregate multi-project statistics',
      message: error.message,
    });
  }
});

// GET /api/v1/projects/:id/summary - Project-level summary
router.get('/:id/summary', async (req, res) => {
  try {
    const project = await db.projects.findUnique({
      where: { id: req.params.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    const quotas = (await db.quota_metrics.findMany()).filter((q) => q.project_id === project.id);
    const requests = (await db.increase_requests.findMany()).filter((r) =>
      quotas.some((q) => q.id === r.quota_metric_id)
    );

    const atRiskQuotas = quotas.filter((q) => q.utilization_percentage >= 80);
    const avgUtilization = quotas.length > 0
      ? parseFloat((quotas.reduce((acc, q) => acc + q.utilization_percentage, 0) / quotas.length).toFixed(2))
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        project,
        quotaCount: quotas.length,
        atRiskCount: atRiskQuotas.length,
        averageUtilization: avgUtilization,
        pendingRequestsCount: requests.filter((r) => r.status === 'PENDING').length,
        quotas,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve project summary',
      message: error.message,
    });
  }
});

// GET /api/v1/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const project = await db.projects.findUnique({
      where: { id: req.params.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve project',
      message: error.message,
    });
  }
});

module.exports = router;

