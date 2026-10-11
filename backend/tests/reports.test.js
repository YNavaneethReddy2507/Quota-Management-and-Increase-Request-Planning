/**
 * Reports, CSV & JSON Export Test Suite
 * Tests CSV and JSON format generation, filters, metadata provenance, audit logs, and executive summaries.
 */

const request = require('supertest');
const app = require('../src/app');

describe('Reports & Export Engine Suite', () => {
  test('GET /api/v1/quotas/export/csv returns valid CSV format with attachment header', async () => {
    const res = await request(app).get('/api/v1/quotas/export/csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.text).toContain('Metric Name,Region,Current Usage,Quota Limit,Utilization %,Risk Classification');
    expect(res.text).toContain('compute.googleapis.com');
  });

  test('GET /api/v1/quotas/export/csv filters by risk_level', async () => {
    const res = await request(app).get('/api/v1/quotas/export/csv?risk_level=CRITICAL');
    expect(res.status).toBe(200);
    expect(res.text).toContain('CRITICAL');
    expect(res.text).not.toContain('NORMAL');
  });

  test('GET /api/v1/quotas/export/json returns formatted payload with metadata', async () => {
    const res = await request(app).get('/api/v1/quotas/export/json');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.metadata).toBeDefined();
    expect(res.body.metadata.governance_system).toBe('Google Cloud Quota Control Plane');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('risk_classification');
  });

  test('GET /api/v1/quotas/export/summary returns executive overview and recommendations', async () => {
    const res = await request(app).get('/api/v1/quotas/export/summary');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.report_title).toContain('Executive Governance Summary');
    expect(res.body.metrics_summary).toHaveProperty('risk_breakdown');
    expect(res.body.actionable_recommendations.length).toBeGreaterThan(0);
  });
});
