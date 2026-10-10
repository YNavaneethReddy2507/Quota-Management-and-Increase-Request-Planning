/**
 * Centralized Configuration Loader Module
 * Quota Management and Increase Request Planning
 */

const path = require('path');
const dotenv = require('dotenv');

// Load .env from backend directory or root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback to current process directory

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),

  // Database settings
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'quota_management',
    url: process.env.DATABASE_URL || `mysql://${process.env.DB_USER || 'root'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || '3306'}/${process.env.DB_NAME || 'quota_management'}`,
  },

  // GCP Settings
  gcp: {
    projectId: process.env.GCP_PROJECT_ID || 'demo-gcp-project',
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  },

  // Notification Webhooks
  notifications: {
    webhookUrl: process.env.WEBHOOK_URL || '',
  },

  // Background cron schedule
  cron: {
    syncSchedule: process.env.SYNC_CRON_SCHEDULE || '0 * * * *',
  },

  // Risk thresholds
  thresholds: {
    highRiskPercent: parseFloat(process.env.HIGH_RISK_THRESHOLD_PERCENT || '80.0'),
    moderateRiskPercent: parseFloat(process.env.MODERATE_RISK_THRESHOLD_PERCENT || '60.0'),
  },

  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

// Quick validation warning if critical credentials are unset in production
if (config.isProduction) {
  if (!process.env.DATABASE_URL && (!process.env.DB_USER || !process.env.DB_PASSWORD)) {
    console.warn('[CONFIG WARNING] Production environment detected without explicit database credentials.');
  }
}

module.exports = config;
