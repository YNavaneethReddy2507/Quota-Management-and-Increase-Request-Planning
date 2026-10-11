/**
 * Notification Service Module
 * Dispatches automated alerts to webhook endpoints (Slack / Discord / Teams)
 * with deduplication suppression for unchanged conditions and in-memory audit logs.
 * Quota Management and Increase Request Planning Control Plane
 */

const axios = require('axios');
const config = require('../config');

// Deduplication cache: stores message signatures mapped to last sent timestamp
const recentAlertsCache = new Map();
const alertHistoryLog = [];
const DEDUPLICATION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

class NotificationService {
  /**
   * Generates a unique signature for alert deduplication.
   */
  static getSignature(message, metadata = {}) {
    return `${message}|${metadata.requestId || ''}|${metadata.status || ''}`;
  }

  /**
   * Dispatches a webhook notification message with metadata and duplicate suppression.
   *
   * @param {string} message - Human-readable alert summary
   * @param {object} [metadata={}] - Structured context data
   * @returns {Promise<boolean>}
   */
  static async sendNotification(message, metadata = {}) {
    const signature = this.getSignature(message, metadata);
    const now = Date.now();

    // Check if identical alert was dispatched within the deduplication window
    if (recentAlertsCache.has(signature)) {
      const lastSent = recentAlertsCache.get(signature);
      if (now - lastSent < DEDUPLICATION_WINDOW_MS) {
        console.log(`[NOTIFICATION SUPPRESSED] Duplicate alert condition suppressed: "${message}"`);
        return true;
      }
    }

    recentAlertsCache.set(signature, now);

    const timestamp = new Date().toISOString();
    const alertEntry = {
      id: `alert-${now}-${Math.random().toString(36).substr(2, 5)}`,
      message,
      metadata,
      timestamp,
    };
    alertHistoryLog.unshift(alertEntry);
    if (alertHistoryLog.length > 50) alertHistoryLog.pop();

    const webhookUrl = config.notifications.webhookUrl;

    const payload = {
      text: message,
      attachments: [
        {
          color: metadata.status === 'REJECTED' ? '#ef4444' : metadata.status === 'APPROVED' ? '#10b981' : '#3b82f6',
          title: metadata.title || 'Google Cloud Quota Governance Alert',
          fields: [
            metadata.requestId ? { title: 'Request ID', value: metadata.requestId, short: true } : null,
            metadata.metricName ? { title: 'Metric', value: metadata.metricName, short: true } : null,
            metadata.requestedLimit ? { title: 'Requested Limit', value: String(metadata.requestedLimit), short: true } : null,
            metadata.status ? { title: 'Status', value: metadata.status, short: true } : null,
            metadata.requestedBy ? { title: 'Requester', value: metadata.requestedBy, short: true } : null,
          ].filter(Boolean),
          footer: 'GCP Quota Governance Control Plane',
          ts: Math.floor(now / 1000),
        },
      ],
      timestamp,
    };

    console.log(`[NOTIFICATION DISPATCH] "${message}"`);

    // If webhookUrl is configured and not the dummy placeholder, dispatch live HTTP call
    if (webhookUrl && webhookUrl.startsWith('http') && !webhookUrl.includes('example.com')) {
      try {
        await axios.post(webhookUrl, payload, { timeout: 4000 });
        console.log(`[NOTIFICATION SUCCESS] Live webhook delivered to ${webhookUrl}`);
        return true;
      } catch (err) {
        console.warn(`[NOTIFICATION WARNING] Webhook delivery failed: ${err.message}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Retrieves recent in-app alert history.
   */
  static getAlertHistory() {
    return [...alertHistoryLog];
  }

  /**
   * Clears the deduplication cache (useful in tests).
   */
  static clearCache() {
    recentAlertsCache.clear();
  }
}

module.exports = NotificationService;
