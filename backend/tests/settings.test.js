/**
 * Settings and Administration Test Suite
 * Tests configuration retrieval, threshold validation, RBAC enforcement, and audit trail.
 */

const request = require('supertest');
const app = require('../src/app');

describe('Settings & Administration Suite', () => {
  test('GET /api/v1/settings returns current system configuration', async () => {
    const res = await request(app).get('/api/v1/settings');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('thresholds');
    expect(res.body.data).toHaveProperty('notifications');
    expect(res.body.data).toHaveProperty('telemetry_sync');
    expect(res.body.data).toHaveProperty('administrative');
    expect(res.body.data.thresholds.global_warning_pct).toBeGreaterThan(0);
    expect(res.body.data.thresholds.global_critical_pct).toBeGreaterThan(res.body.data.thresholds.global_warning_pct);
  });

  test('PATCH /api/v1/settings is blocked for non-Admin roles (RBAC)', async () => {
    const res = await request(app)
      .patch('/api/v1/settings')
      .set('X-User-Role', 'Developer')
      .send({
        thresholds: { global_warning_pct: 60 },
      });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  test('PATCH /api/v1/settings rejects invalid threshold logic (warning >= critical)', async () => {
    const res = await request(app)
      .patch('/api/v1/settings')
      .set('X-User-Role', 'Admin')
      .send({
        thresholds: { global_warning_pct: 95, global_critical_pct: 90 },
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('strictly lower');
  });

  test('PATCH /api/v1/settings successfully updates valid configurations and logs audit', async () => {
    const res = await request(app)
      .patch('/api/v1/settings')
      .set('X-User-Role', 'Admin')
      .send({
        thresholds: { global_warning_pct: 70, global_critical_pct: 88 },
        telemetry_sync: { frequency: 'DAILY' },
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.thresholds.global_warning_pct).toBe(70);
    expect(res.body.data.thresholds.global_critical_pct).toBe(88);
    expect(res.body.data.telemetry_sync.frequency).toBe('DAILY');

    // Verify audit log
    const auditRes = await request(app).get('/api/v1/settings/audit');
    expect(auditRes.status).toBe(200);
    expect(auditRes.body.count).toBeGreaterThanOrEqual(2);
  });
});
