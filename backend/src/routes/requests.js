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

    // 4. Save record to MySQL with status PENDING
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
      `Current: ${currentLimit} -> Requested: ${requested_limit}. Requester: ${requester}`
    );

    return res.status(201).json({
      success: true,
      message: 'Quota increase request drafted successfully',
      data: newRequest,
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

module.exports = router;
