/**
 * Unit & Integration Tests: Approval State Machine
 * Verifies strict state transitions, status guards, rejection from REJECTED to APPROVED, and RBAC.
 * Quota Management and Increase Request Planning Control Plane
 */

const request = require('supertest');
const app = require('../src/app');

describe('Increase Request Approval State Machine', () => {
  let createdRequestId;

  beforeAll(async () => {
    // Draft a fresh test request
    const response = await request(app)
      .post('/api/v1/requests')
      .send({
        quota_metric_id: 'qm-001',
        requested_limit: 175.0,
        business_justification: 'State machine validation testing for high-load clusters',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('PENDING');
    createdRequestId = response.body.data.id;
  });

  test('successfully rejects a PENDING request with mandatory admin_comments', async () => {
    const response = await request(app)
      .patch(`/api/v1/requests/${createdRequestId}/reject`)
      .set('X-User-Role', 'Admin')
      .send({
        admin_comments: 'Declined due to budget constraints in the current quarter.',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('REJECTED');
    expect(response.body.data.admin_comments).toBe('Declined due to budget constraints in the current quarter.');
  });

  test('STRICT STATE GUARD: A request CANNOT transition from REJECTED to APPROVED', async () => {
    // Attempt to approve the now REJECTED request
    const response = await request(app)
      .patch(`/api/v1/requests/${createdRequestId}/approve`)
      .set('X-User-Role', 'Admin')
      .send({
        admin_comments: 'Attempting invalid transition to approved',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid State Transition');
    expect(response.body.message).toContain('Cannot approve request with current status');
  });

  test('STRICT STATE GUARD: A request CANNOT transition from REJECTED to REJECTED again', async () => {
    const response = await request(app)
      .patch(`/api/v1/requests/${createdRequestId}/reject`)
      .set('X-User-Role', 'Admin')
      .send({
        admin_comments: 'Attempting duplicate rejection',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid State Transition');
  });

  test('RBAC GUARD: Developer role is forbidden (403) from approving or rejecting', async () => {
    // Create new pending request
    const newReq = await request(app)
      .post('/api/v1/requests')
      .send({
        quota_metric_id: 'qm-002',
        requested_limit: 32.0,
        business_justification: 'GPU capacity scaling for distributed deep learning model training',
      });

    const pendingId = newReq.body.data.id;

    // Developer attempts to approve
    const devApprove = await request(app)
      .patch(`/api/v1/requests/${pendingId}/approve`)
      .set('X-User-Role', 'Developer')
      .send();

    expect(devApprove.status).toBe(403);
    expect(devApprove.body.error).toBe('Forbidden');

    // Developer attempts to reject
    const devReject = await request(app)
      .patch(`/api/v1/requests/${pendingId}/reject`)
      .set('X-User-Role', 'Developer')
      .send({ admin_comments: 'Unauthorized rejection attempt' });

    expect(devReject.status).toBe(403);
    expect(devReject.body.error).toBe('Forbidden');
  });

  test('VALIDATION GUARD: Rejection without admin_comments fails with 400', async () => {
    // Create new pending request
    const newReq = await request(app)
      .post('/api/v1/requests')
      .send({
        quota_metric_id: 'qm-003',
        requested_limit: 70000.0,
        business_justification: 'Additional disk volume allocations for disaster recovery replica',
      });

    const pendingId = newReq.body.data.id;

    // Reject without comments
    const response = await request(app)
      .patch(`/api/v1/requests/${pendingId}/reject`)
      .set('X-User-Role', 'Admin')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation Error');
  });
});
