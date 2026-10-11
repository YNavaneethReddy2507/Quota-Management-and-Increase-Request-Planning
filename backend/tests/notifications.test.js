/**
 * Notifications and Alerts Test Suite
 * Tests alert dispatching, duplicate suppression window, and GET /api/v1/notifications audit endpoint.
 */

const request = require('supertest');
const app = require('../src/app');
const NotificationService = require('../src/services/notification_service');

describe('Notifications & Duplicate Suppression Suite', () => {
  beforeEach(() => {
    NotificationService.clearCache();
  });

  test('sendNotification dispatches new alert and stores in alert history', async () => {
    const success = await NotificationService.sendNotification('Alert test message', {
      requestId: 'test-req-01',
      status: 'PENDING',
    });

    expect(success).toBe(true);
    const history = NotificationService.getAlertHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].message).toBe('Alert test message');
  });

  test('sendNotification suppresses identical duplicate notification within time window', async () => {
    const msg = 'Saturation warning for compute.googleapis.com/cpus';
    const meta = { status: 'CRITICAL', requestId: 'req-dup-01' };

    const first = await NotificationService.sendNotification(msg, meta);
    expect(first).toBe(true);

    const historyCountBefore = NotificationService.getAlertHistory().length;

    // Dispatch identical message immediately
    const duplicate = await NotificationService.sendNotification(msg, meta);
    expect(duplicate).toBe(true);

    // History count should NOT increase because duplicate was suppressed
    const historyCountAfter = NotificationService.getAlertHistory().length;
    expect(historyCountAfter).toBe(historyCountBefore);
  });

  test('GET /api/v1/notifications returns alert history array', async () => {
    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
