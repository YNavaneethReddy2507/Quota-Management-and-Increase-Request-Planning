/**
 * Increase Requests Router
 * Handles drafting and listing quota increase requests
 * Quota Management and Increase Request Planning Control Plane
 */

const express = require('express');
const { z } = require('zod');
const { db } = require('../db');

const router = express.Router();

// Validation schema for creating a quota increase request
const createRequestSchema = z.object({
  quota_metric_id: z.string().min(1, 'quota_metric_id is required'),
  requested_limit: z.number().positive('requested_limit must be a positive number'),
  business_justification: z.string().min(10, 'business_justification must be at least 10 characters long'),
  requested_by: z.string().optional(),
});

// GET /api/v1/requests - Lists all requests (optional filter by status)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const requests = await db.increase_requests.findMany({ where });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve requests',
      message: error.message,
    });
  }
});

// GET /api/v1/requests/:id
router.get('/:id', async (req, res) => {
  try {
    const request = await db.increase_requests.findUnique({
      where: { id: req.params.id },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve request',
      message: error.message,
    });
  }
});

// POST /api/v1/requests - Draft new increase request
router.post('/', async (req, res) => {
  try {
    // 1. Validate payload with Zod
    const validationResult = createRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validationResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const {
      quota_metric_id,
      requested_limit,
      business_justification,
      requested_by,
    } = validationResult.data;

    // 2. Fetch target quota metric from database
    const quota = await db.quota_metrics.findUnique({
      where: { id: quota_metric_id },
    });

    if (!quota) {
      return res.status(404).json({
        success: false,
        error: 'Resource Not Found',
        message: `Quota metric with ID '${quota_metric_id}' does not exist.`,
      });
    }

    // 3. Enforce strict rule: requested_limit MUST be greater than current_limit
    const currentLimit = quota.quota_limit;
    if (requested_limit <= currentLimit) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Quota Limit Target',
        message: `Requested limit (${requested_limit}) must be strictly greater than the current quota limit (${currentLimit}).`,
      });
    }

    // Determine requester identity
    const requester =
      requested_by ||
      req.headers['x-user-email'] ||
      'cloud-engineer@enterprise.org';

    // 4. Calculate Risk Assessment & Approval Confidence Score (Phase 15)
    const RiskAssessmentService = require('../services/risk_assessment_service');
    const riskAssessment = RiskAssessmentService.calculateApprovalConfidenceScore({
      currentUsage: quota.current_usage,
      currentLimit,
      requestedLimit: requested_limit,
      utilizationPercentage: quota.utilization_percentage,
      justification: business_justification,
    });

    // 5. Save record to MySQL with status PENDING
    const newRequest = await db.increase_requests.create({
      data: {
        quota_metric_id,
        requested_by: requester,
        current_limit: currentLimit,
        requested_limit,
        business_justification,
        status: 'PENDING',
        admin_comments: null,
      },
    });

    console.log(
      `[REQUEST DRAFTED] Created request ${newRequest.id} for metric ${quota_metric_id}. ` +
      `Score: ${riskAssessment.score} (${riskAssessment.category}). Current: ${currentLimit} -> Requested: ${requested_limit}. Requester: ${requester}`
    );

    // Phase 19: Notification Webhook Trigger on Draft
    const NotificationService = require('../services/notification_service');
    NotificationService.sendNotification(
      `New Quota Increase Request drafted for metric '${quota.metric_name}' (${quota.region}): requested ${requested_limit} (current ${currentLimit}) by ${requester}. Confidence Score: ${riskAssessment.score}/100.`,
      {
        requestId: newRequest.id,
        metricName: quota.metric_name,
        requestedLimit: requested_limit,
        status: 'PENDING',
        requestedBy: requester,
      }
    ).catch((err) => console.warn('[NOTIFICATION HOOK ERROR]', err.message));

    return res.status(201).json({
      success: true,
      message: 'Quota increase request drafted successfully',
      data: {
        ...newRequest,
        approval_confidence_score: riskAssessment.score,
        risk_assessment: riskAssessment,
      },
    });
  } catch (error) {
    console.error('[REQUEST CREATION ERROR]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to draft quota increase request',
      message: error.message,
    });
  }
});

// Rejection validation schema
const rejectRequestSchema = z.object({
  admin_comments: z.string().min(5, 'admin_comments is required and must be at least 5 characters'),
});

// Approval optional comments schema
const approveRequestSchema = z.object({
  admin_comments: z.string().optional(),
});

// PATCH /api/v1/requests/:id/approve - Approve Request
router.patch('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const validation = approveRequestSchema.safeParse(req.body || {});
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: validation.error.errors,
      });
    }

    const request = await db.increase_requests.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
      });
    }

    // Strict State Machine: Database status MUST be PENDING to proceed
    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Invalid State Transition',
        message: `Cannot approve request with current status '${request.status}'. Only requests in 'PENDING' status can be approved.`,
        currentStatus: request.status,
      });
    }

    // Update MySQL status to APPROVED
    let updated = await db.increase_requests.update({
      where: { id },
      data: {
        status: 'APPROVED',
        admin_comments: validation.data.admin_comments || 'Approved by Cloud Administrator',
      },
    });

    console.log(`[STATE MACHINE] Request ${id} transitioned from PENDING -> APPROVED`);

    // Phase 17 & 18: Outbound GCP Quota API Submission with Exponential Backoff
    const GcpQuotaSubmissionService = require('../services/gcp_quota_submission_service');
    const { executeWithExponentialBackoff } = require('../utils/retry_handler');

    const quota = await db.quota_metrics.findUnique({ where: { id: request.quota_metric_id } });
    const project = quota ? await db.projects.findUnique({ where: { id: quota.project_id } }) : null;
    const gcpProjectId = project ? project.gcp_project_id : 'demo-gcp-project';

    let gcpSubmissionResult = null;
    try {
      // Transition to GCP_SUBMITTED
      await db.increase_requests.update({
        where: { id },
        data: { status: 'GCP_SUBMITTED' },
      });

      // Wrap in exponential backoff retry mechanism (Phase 18)
      gcpSubmissionResult = await executeWithExponentialBackoff(
        async () => {
          return await GcpQuotaSubmissionService.submitQuotaPreference({
            gcpProjectId,
            region: quota ? quota.region : 'us-central1',
            metricName: quota ? quota.metric_name : 'compute.googleapis.com/cpus',
            requestedLimit: request.requested_limit,
            justification: request.business_justification,
            requesterEmail: request.requested_by,
          });
        },
        {
          maxRetries: 3,
          initialDelayMs: 300,
          operationName: `GCP Quota Submit for ${id}`,
        }
      );

      // On successful submission, update MySQL status to GCP_FULFILLED
      updated = await db.increase_requests.update({
        where: { id },
        data: { status: 'GCP_FULFILLED' },
      });
      console.log(`[STATE MACHINE] Request ${id} transitioned to GCP_FULFILLED.`);
    } catch (gcpErr) {
      // If all retries fail, update MySQL status to FAILED and log error trace
      console.error(
        `[GCP RETRY EXHAUSTION] Quota increase submission failed after retries for request ${id}: ${gcpErr.message}`,
        gcpErr.stack
      );

      updated = await db.increase_requests.update({
        where: { id },
        data: {
          status: 'FAILED',
          admin_comments: `Submission to GCP failed: ${gcpErr.message}`,
        },
      });
    }

    // Trigger Notification Webhook on Approve
    const NotificationService = require('../services/notification_service');
    NotificationService.sendNotification(
      `Quota Increase Request ${id} APPROVED by administrator. GCP Status: ${updated.status}. Limit: ${request.requested_limit}.`,
      {
        requestId: id,
        status: updated.status,
        requestedLimit: request.requested_limit,
      }
    ).catch((err) => console.warn('[NOTIFICATION HOOK ERROR]', err.message));

    return res.status(200).json({
      success: true,
      message: `Quota increase request processed. Final status: ${updated.status}`,
      data: updated,
      gcp_submission: gcpSubmissionResult,
    });
  } catch (error) {
    console.error('[APPROVE REQUEST ERROR]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to approve request',
      message: error.message,
    });
  }
});

// PATCH /api/v1/requests/:id/reject - Reject Request
router.patch('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    // Reject requires admin_comments
    const validation = rejectRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'A rejection reason (admin_comments) is mandatory when rejecting a quota request.',
        details: validation.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const request = await db.increase_requests.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
      });
    }

    // Strict State Machine: Database status MUST be PENDING to proceed
    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Invalid State Transition',
        message: `Cannot reject request with current status '${request.status}'. Only requests in 'PENDING' status can be rejected.`,
        currentStatus: request.status,
      });
    }

    // Update MySQL status to REJECTED with mandatory admin comments
    const updated = await db.increase_requests.update({
      where: { id },
      data: {
        status: 'REJECTED',
        admin_comments: validation.data.admin_comments,
      },
    });

    console.log(`[STATE MACHINE] Request ${id} transitioned from PENDING -> REJECTED. Reason: "${validation.data.admin_comments}"`);

    // Trigger Notification Webhook on Reject
    const NotificationService = require('../services/notification_service');
    NotificationService.sendNotification(
      `Quota Increase Request ${id} REJECTED by administrator. Reason: "${validation.data.admin_comments}".`,
      {
        requestId: id,
        status: 'REJECTED',
        adminComments: validation.data.admin_comments,
      }
    ).catch((err) => console.warn('[NOTIFICATION HOOK ERROR]', err.message));

    return res.status(200).json({
      success: true,
      message: 'Quota increase request rejected',
      data: updated,
    });
  } catch (error) {
    console.error('[REJECT REQUEST ERROR]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reject request',
      message: error.message,
    });
  }
});

module.exports = router;
