/**
 * Authentication and Authorization Integration Tests
 * Validates role-based access control, header validation, and forbidden operation safeguards.
 */

const request = require('supertest');
const app = require('../src/app');

describe('Authentication and RBAC Verification Suite', () => {
  let testRequestId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/requests')
      .send({
        quota_metric_id: 'qm-001',
        requested_limit: 150.0,
        business_justification: 'Automated test request for auth suite',
      });
    testRequestId = res.body.data.id;
  });

  test('Public routes allow unauthenticated access', async () => {
    const healthRes = await request(app).get('/api/v1/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.status).toBe('ok');

    const projectsRes = await request(app).get('/api/v1/projects');
    expect(projectsRes.status).toBe(200);
    expect(Array.isArray(projectsRes.body.data)).toBe(true);
  });

  test('Protected admin endpoints reject request when X-User-Role is missing (defaults to Developer)', async () => {
    const res = await request(app)
      .patch(`/api/v1/requests/${testRequestId}/approve`)
      .send();

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
    expect(res.body.currentRole).toBe('Developer');
  });

  test('Protected admin endpoints reject Viewer or Developer role', async () => {
    const resViewer = await request(app)
      .patch(`/api/v1/requests/${testRequestId}/approve`)
      .set('X-User-Role', 'Viewer')
      .send();

    expect(resViewer.status).toBe(403);
    expect(resViewer.body.error).toBe('Forbidden');

    const resDev = await request(app)
      .patch(`/api/v1/requests/${testRequestId}/approve`)
      .set('X-User-Role', 'Developer')
      .send();

    expect(resDev.status).toBe(403);
    expect(resDev.body.error).toBe('Forbidden');
  });

  test('Protected admin endpoints accept Admin role', async () => {
    const resAdmin = await request(app)
      .patch(`/api/v1/requests/${testRequestId}/reject`)
      .set('X-User-Role', 'Admin')
      .send({ admin_comments: 'Declined by lead cloud administrator' });

    expect(resAdmin.status).toBe(200);
    expect(resAdmin.body.data.status).toBe('REJECTED');
    expect(resAdmin.body.data.admin_comments).toBe('Declined by lead cloud administrator');
  });
});

