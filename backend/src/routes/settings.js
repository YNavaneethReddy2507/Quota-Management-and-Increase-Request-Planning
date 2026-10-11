/**
 * Settings and Administration Router
 * Manages threshold governance, notification channels, sync intervals, and administrative audit trails.
 * Quota Management and Increase Request Planning Control Plane
 */

const express = require('express');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

// State store for settings
let systemSettings = {
  thresholds: {
    global_warning_pct: 75,
    global_critical_pct: 90,
    service_overrides: [
      { service: 'compute.googleapis.com', warning_pct: 70, critical_pct: 85 },
      { service: 'storage.googleapis.com', warning_pct: 80, critical_pct: 95 },
      { service: 'aiplatform.googleapis.com', warning_pct: 65, critical_pct: 80 },
    ],
  },
  notifications: {
    email_enabled: true,
    alert_email: 'cloud-sre-team@enterprise.org',
    webhook_enabled: true,
    webhook_url: 'https://example.com/api/webhook-placeholder',
    slack_enabled: true,
    slack_channel: '#gcp-quota-alerts',
    pagerduty_enabled: false,
    pagerduty_routing_key: '',
  },
  telemetry_sync: {
    frequency: 'HOURLY', // MANUAL, HOURLY, DAILY
    auto_sync_enabled: true,
    last_synced_at: new Date().toISOString(),
  },
  administrative: {
    service_account: 'quota-manager-sa@enterprise-prod-finance-42.iam.gserviceaccount.com',
    enforce_rbac: true,
    users: [
      { id: 'usr-001', name: 'Lead Architect', email: 'lead.architect@enterprise.org', role: 'Admin' },
      { id: 'usr-002', name: 'FinOps Specialist', email: 'finops.lead@enterprise.org', role: 'FinOps' },
      { id: 'usr-003', name: 'Site Reliability Engineer', email: 'sre.oncall@enterprise.org', role: 'SRE' },
      { id: 'usr-004', name: 'Backend Developer', email: 'app.developer@enterprise.org', role: 'Developer' },
    ],
  },
};

const settingsAuditLog = [
  {
    id: 'audit-001',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    changed_by: 'lead.architect@enterprise.org',
    role: 'Admin',
    action: 'INITIAL_CONFIGURATION',
    details: 'System initial bootstrap settings applied.',
  },
];

// GET /api/v1/settings - Get current configuration
router.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    data: systemSettings,
  });
});

// GET /api/v1/settings/audit - Audit trail of administrative modifications
router.get('/audit', (req, res) => {
  return res.status(200).json({
    success: true,
    count: settingsAuditLog.length,
    data: settingsAuditLog,
  });
});

// PATCH /api/v1/settings - Update settings (Admin only)
router.patch('/', requireRole(['Admin']), (req, res) => {
  try {
    const { thresholds, notifications, telemetry_sync, administrative } = req.body;

    // Validate thresholds if provided
    if (thresholds) {
      if (thresholds.global_warning_pct !== undefined) {
        const warn = Number(thresholds.global_warning_pct);
        if (isNaN(warn) || warn < 1 || warn > 99) {
          return res.status(400).json({
            success: false,
            error: 'global_warning_pct must be a valid number between 1 and 99',
          });
        }
      }
      if (thresholds.global_critical_pct !== undefined) {
        const crit = Number(thresholds.global_critical_pct);
        if (isNaN(crit) || crit < 1 || crit > 100) {
          return res.status(400).json({
            success: false,
            error: 'global_critical_pct must be a valid number between 1 and 100',
          });
        }
      }

      const targetWarn = thresholds.global_warning_pct !== undefined ? Number(thresholds.global_warning_pct) : systemSettings.thresholds.global_warning_pct;
      const targetCrit = thresholds.global_critical_pct !== undefined ? Number(thresholds.global_critical_pct) : systemSettings.thresholds.global_critical_pct;

      if (targetWarn >= targetCrit) {
        return res.status(400).json({
          success: false,
          error: 'Warning threshold must be strictly lower than critical threshold',
        });
      }

      systemSettings.thresholds = {
        ...systemSettings.thresholds,
        ...thresholds,
      };
    }

    // Validate notifications if provided
    if (notifications) {
      if (notifications.alert_email !== undefined && !notifications.alert_email.includes('@')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid alert email address',
        });
      }
      systemSettings.notifications = {
        ...systemSettings.notifications,
        ...notifications,
      };
    }

    // Validate telemetry sync frequency if provided
    if (telemetry_sync) {
      if (telemetry_sync.frequency && !['MANUAL', 'HOURLY', 'DAILY'].includes(telemetry_sync.frequency)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid frequency. Allowed options: MANUAL, HOURLY, DAILY',
        });
      }
      systemSettings.telemetry_sync = {
        ...systemSettings.telemetry_sync,
        ...telemetry_sync,
      };
    }

    // Validate administrative user role updates if provided
    if (administrative) {
      systemSettings.administrative = {
        ...systemSettings.administrative,
        ...administrative,
      };
    }

    // Record audit event
    const userRole = req.header('X-User-Role') || 'Admin';
    const auditRecord = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      changed_by: req.header('X-User-Email') || 'admin@enterprise.org',
      role: userRole,
      action: 'UPDATE_CONFIGURATION',
      details: `Settings updated for: ${Object.keys(req.body).join(', ')}`,
    };
    settingsAuditLog.push(auditRecord);

    return res.status(200).json({
      success: true,
      message: 'System settings successfully updated',
      data: systemSettings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to update configuration settings',
      message: error.message,
    });
  }
});

module.exports = router;
