/**
 * Multi-Project Management Test Suite
 * Tests multi-project listing, individual project summary, and cross-project aggregation.
 */

const request = require('supertest');
const app = require('../src/app');

describe('Multi-Project Management Suite', () => {
  test('GET /api/v1/projects returns authorized GCP projects', async () => {
    const res = await request(app).get('/api/v1/projects');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/v1/projects/summary/aggregate returns cross-project aggregated statistics', async () => {
    const res = await request(app).get('/api/v1/projects/summary/aggregate');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalProjects');
    expect(res.body.data).toHaveProperty('totalQuotas');
    expect(res.body.data).toHaveProperty('averageUtilization');
    expect(Array.isArray(res.body.data.projectsSummary)).toBe(true);
  });

  test('GET /api/v1/projects/proj-001/summary returns project quotas and at-risk count', async () => {
    const res = await request(app).get('/api/v1/projects/proj-001/summary');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('quotaCount');
    expect(res.body.data).toHaveProperty('atRiskCount');
    expect(res.body.data).toHaveProperty('averageUtilization');
  });

  test('GET /api/v1/projects/invalid-project-id/summary returns 404', async () => {
    const res = await request(app).get('/api/v1/projects/non-existent-proj/summary');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Project not found');
  });
});
