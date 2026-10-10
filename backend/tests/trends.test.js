/**
 * Historical Analytics & Trend Calculation Test Suite
 * Validates time series trend observations, burn rate percentages, and window filtering.
 */

const request = require('supertest');
const app = require('../src/app');

describe('Historical Analytics & Trends Test Suite', () => {
  test('GET /api/v1/quotas/qm-001/trends returns historical observations and daily burn rate', async () => {
    const res = await request(app).get('/api/v1/quotas/qm-001/trends?days=14');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.quota_metric_id).toBe('qm-001');
    expect(res.body.window_days).toBe(14);
    expect(Array.isArray(res.body.observations)).toBe(true);
    expect(res.body.observations.length).toBe(15);
    expect(res.body).toHaveProperty('burn_rate_daily_percent');
    expect(typeof res.body.burn_rate_daily_percent).toBe('number');
  });

  test('GET /api/v1/quotas/non-existent-id/trends returns 404', async () => {
    const res = await request(app).get('/api/v1/quotas/invalid-quota-uuid/trends');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Quota metric not found');
  });
});
