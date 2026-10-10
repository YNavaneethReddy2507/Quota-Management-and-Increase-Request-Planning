/**
 * Automated Background Cron Job Scheduler
 * Orchestrates Quota Limit Ingestion, Usage Telemetry, and Threshold Calculations.
 * Quota Management and Increase Request Planning Control Plane
 */

const cron = require('node-cron');
const config = require('../config');
const { db } = require('../db');
const QuotaService = require('../services/quota_service');
const MonitoringService = require('../services/monitoring_service');
const ThresholdService = require('../services/threshold_service');

let scheduledTask = null;
let isPipelineRunning = false;

/**
 * Runs the complete ingestion and calculation pipeline for all registered projects.
 * Fully wrapped in try/catch to protect against application crashes.
 */
async function executeIngestionCycle() {
  if (isPipelineRunning) {
    console.log('[CRON SCHEDULER] Ingestion cycle already in progress. Skipping duplicate tick.');
    return;
  }

  isPipelineRunning = true;
  const startTime = Date.now();
  console.log(`\n[CRON SCHEDULER START] Initiating automated quota ingestion & telemetry cycle at ${new Date().toISOString()}`);

  try {
    const projects = await db.projects.findMany();
    console.log(`[CRON SCHEDULER] Processing ${projects.length} registered GCP projects...`);

    for (const project of projects) {
      try {
        console.log(`[CRON] Processing Project: ${project.gcp_project_id} (${project.environment})`);

        // Phase 9: Sync Quota Limits
        await QuotaService.syncQuotaLimits(project.gcp_project_id);

        // Phase 10: Sync Usage Telemetry
        await MonitoringService.syncUsageTelemetry(project.gcp_project_id);
      } catch (projectError) {
        // Individual project failure does not abort remaining projects
        console.error(
          `[CRON PROJECT ERROR] Failed ingestion for project ${project.gcp_project_id}: ${projectError.message}`,
          projectError.stack
        );
      }
    }

    // Phase 11: Threshold & Utilization Calculation Logic
    const thresholdReport = await ThresholdService.recalculateAllThresholds();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(
      `[CRON SCHEDULER COMPLETE] Pipeline finished in ${duration}s. ` +
      `Evaluated ${thresholdReport.totalEvaluated} metrics. High-risk alerts: ${thresholdReport.highRiskCount}.\n`
    );

    return {
      success: true,
      durationSeconds: parseFloat(duration),
      thresholdReport,
    };
  } catch (criticalError) {
    // Top-level catch ensures application server never crashes
    console.error(
      `[CRON CRITICAL ERROR] Unexpected failure during ingestion cycle: ${criticalError.message}`,
      criticalError.stack
    );
    return {
      success: false,
      error: criticalError.message,
    };
  } finally {
    isPipelineRunning = false;
  }
}

/**
 * Initializes and starts the background cron schedule.
 */
function startCronScheduler() {
  const schedule = config.cron.syncSchedule || '0 * * * *'; // hourly default

  if (!cron.validate(schedule)) {
    console.error(`[CRON ERROR] Invalid cron expression: "${schedule}". Defaulting to "0 * * * *"`);
  }

  console.log(`[CRON SCHEDULER] Initializing automated background scheduler with expression: '${schedule}'`);

  scheduledTask = cron.schedule(schedule, async () => {
    console.log('[CRON SCHEDULER] Cron tick triggered.');
    await executeIngestionCycle();
  });

  return scheduledTask;
}

/**
 * Stops the running cron job.
 */
function stopCronScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    console.log('[CRON SCHEDULER] Background scheduler stopped.');
  }
}

module.exports = {
  startCronScheduler,
  stopCronScheduler,
  executeIngestionCycle,
};
