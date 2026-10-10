/**
 * Notification Service Module
 * Dispatches automated alerts to webhook endpoints (Slack / Discord / Teams).
 * Quota Management and Increase Request Planning Control Plane
 */

const axios = require('axios');
const config = require('../config');

class NotificationService {
  /**
   * Dispatches a webhook notification message with metadata.
   *
   * @param {string} message - Human-readable alert summary
   * @param {object} [metadata={}] - Structured context data
   * @returns {Promise<boolean>}
   */
  static async sendNotification(message, metadata = {}) {
    const webhookUrl = config.notifications.webhookUrl;
    const timestamp = new Date().toISOString();

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
          ts: Math.floor(Date.now() / 1000),
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
}

module.exports = NotificationService;
