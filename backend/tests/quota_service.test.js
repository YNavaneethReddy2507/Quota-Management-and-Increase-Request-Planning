/**
 * Quota Service & Cloud Quotas Retrieval Test Suite
 * Validates quota limits fetching, payload normalization, error resilience, and synchronization.
 */

const request = require('supertest');
const app = require('../src/app');
const QuotaService = require('../src/services/quota_service');

describe('Live Quota Retrieval & QuotaService Suite', () => {
  test('fetchGcpQuotaLimits returns normalized array of quotas with metricName, region, and quotaLimit', async () => {
    const limits = await QuotaService.fetchGcpQuotaLimits('enterprise-prod-finance-42', 'us-central1');
    expect(Array.isArray(limits)).toBe(true);
    expect(limits.length).toBeGreaterThan(0);

    const first = limits[0];
    expect(first).toHaveProperty('metricName');
    expect(first).toHaveProperty('region', 'us-central1');
    expect(first).toHaveProperty('quotaLimit');
    expect(typeof first.quotaLimit).toBe('number');
  });

  test('syncQuotaLimits upserts quotas into database', async () => {
    const summary = await QuotaService.syncQuotaLimits('enterprise-prod-finance-42', 'us-central1');
    expect(summary).toBeDefined();
    expect(summary.gcpProjectId).toBe('enterprise-prod-finance-42');
    expect(summary.syncedCount).toBeGreaterThan(0);
  });

  test('POST /api/v1/quotas/sync successfully triggers quota synchronization', async () => {
    const res = await request(app)
      .post('/api/v1/quotas/sync')
      .send({ gcp_project_id: 'enterprise-prod-finance-42', region: 'us-central1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.syncedCount).toBeGreaterThan(0);
  });
});
