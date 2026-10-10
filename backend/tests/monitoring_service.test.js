/**
 * Monitoring Service & Cloud Monitoring Telemetry Test Suite
 * Validates MQL query generation, usage telemetry parsing, and metric utilization sync.
 */

const MonitoringService = require('../src/services/monitoring_service');

describe('Usage Metrics Integration & MonitoringService Suite', () => {
  test('buildMqlQuery generates valid MQL query string for GCP Quotas', () => {
    const query = MonitoringService.buildMqlQuery('enterprise-prod-finance-42', 'compute.googleapis.com/cpus');
    expect(query).toContain('fetch consumer_quota');
    expect(query).toContain('compute.googleapis.com/cpus');
    expect(query).toContain('enterprise-prod-finance-42');
  });

  test('fetchTelemetry returns structured telemetry measurements', async () => {
    const telemetry = await MonitoringService.fetchTelemetry('enterprise-prod-finance-42', 'us-central1');
    expect(Array.isArray(telemetry)).toBe(true);
    expect(telemetry.length).toBeGreaterThan(0);

    const first = telemetry[0];
    expect(first).toHaveProperty('metricName');
    expect(first).toHaveProperty('region', 'us-central1');
    expect(first).toHaveProperty('usage');
    expect(typeof first.usage).toBe('number');
  });

  test('syncUsageTelemetry updates metrics usage and recalculates utilization', async () => {
    const summary = await MonitoringService.syncUsageTelemetry('enterprise-prod-finance-42', 'us-central1');
    expect(summary).toBeDefined();
    expect(summary.gcpProjectId).toBe('enterprise-prod-finance-42');
    expect(summary.syncedCount).toBeGreaterThan(0);
  });
});
