/**
 * End-to-End User Journey Verification Suite
 * Validates the complete lifecycle:
 * Project selection -> Quotas discovery -> Risk evaluation -> Forecasting ->
 * Recommendation buffer -> Increase planning -> Admin approval & submission ->
 * Audit and notification verification.
 */

const request = require('supertest');
const app = require('../src/app');

describe('Full End-to-End User Journey Verification', () => {
  let selectedProjectId;
  let targetQuotaId;
  let createdRequestId;

  test('Step 1: Projects Discovery & Selection', async () => {
    const res = await request(app).get('/api/v1/projects');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const prodProject = res.body.data.find((p) => p.environment === 'PRODUCTION');
    expect(prodProject).toBeDefined();
    selectedProjectId = prodProject.id;
  });

  test('Step 2: Live Quotas & Risk Detection', async () => {
    const res = await request(app).get(`/api/v1/quotas?project_id=${selectedProjectId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    // Identify high-risk / saturated quota
    const highRiskQuota = res.body.data.find((q) => q.utilization_percentage >= 80);
    expect(highRiskQuota).toBeDefined();
    targetQuotaId = highRiskQuota.id;
  });

  test('Step 3: Linear Demand Forecasting & Velocity', async () => {
    const res = await request(app).get(`/api/v1/quotas/${targetQuotaId}/forecast?horizon_days=60`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('currentUtilizationPct');
    expect(res.body.data).toHaveProperty('projections');
    expect(res.body.data.projections.length).toBeGreaterThan(0);
  });

  test('Step 4: Recommendation Buffer Sizing', async () => {
    const res = await request(app).get(`/api/v1/quotas/${targetQuotaId}/recommendation?safety_margin_pct=25`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('recommendedLimit');
    expect(res.body.data).toHaveProperty('confidenceScore');
    expect(res.body.data.recommendedLimit).toBeGreaterThan(res.body.data.currentLimit);
  });

  test('Step 5: Increase Request Planning & Drafting', async () => {
    const res = await request(app)
      .post('/api/v1/requests')
      .set('X-User-Role', 'Developer')
      .send({
        quota_metric_id: targetQuotaId,
        requested_limit: 250,
        business_justification: 'Critical end-of-quarter analytics data pipeline expansion scheduled for execution next week.',
        requested_by: 'developer@enterprise.org',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
    createdRequestId = res.body.data.id;
  });

  test('Step 6: Security Verification - Developer Forbidden to Self-Approve (403)', async () => {
    const res = await request(app)
      .patch(`/api/v1/requests/${createdRequestId}/approve`)
      .set('X-User-Role', 'Developer')
      .send({ admin_comments: 'Unauthorized developer approval attempt' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  test('Step 7: Admin Approval & GCP Submission Workflow', async () => {
    const res = await request(app)
      .patch(`/api/v1/requests/${createdRequestId}/approve`)
      .set('X-User-Role', 'Admin')
      .send({ admin_comments: 'Approved by Lead Cloud Solutions Architect following FinOps capacity audit.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // In local test environment without real GCP token, status transitions to FAILED gracefully
    expect(['APPROVED', 'FAILED']).toContain(res.body.data.status);
    expect(res.body.data.admin_comments).toBeDefined();
    expect(res.body.data.admin_comments.length).toBeGreaterThan(0);
  });

  test('Step 8: Notification & Audit Ledger Verification', async () => {
    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    // Verify notification audit log recorded creation or review of the request
    const found = res.body.data.some(
      (n) => n.message.includes('250') || n.message.includes(createdRequestId) || n.message.includes('cpus')
    );
    expect(found).toBe(true);
  });

  test('Step 9: Governance Executive Summary Export', async () => {
    const res = await request(app).get('/api/v1/quotas/export/summary');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.metrics_summary.total_quotas_monitored).toBeGreaterThan(0);
  });
});
