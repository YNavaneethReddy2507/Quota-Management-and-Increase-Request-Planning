/**
 * Performance & Reliability Test Suite
 * Tests detailed component health checks, response cache headers, and reliability fallbacks.
 */

const request = require('supertest');
const app = require('../src/app');
const { quotaCache } = require('../src/utils/cache');

describe('Performance & Reliability Suite', () => {
  beforeEach(() => {
    quotaCache.clear();
  });

  test('GET /api/v1/health/detailed reports component readiness and resource metrics', async () => {
    const res = await request(app).get('/api/v1/health/detailed');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.components).toBeDefined();
    expect(res.body.components.database.status).toBe('UP');
    expect(res.body.components.quota_cache.status).toBe('UP');
    expect(res.body.components.memory).toHaveProperty('heap_used_mb');
  });

  test('Response cache middleware correctly serves cache hits with X-Cache header', async () => {
    // First request: Cache MISS
    const res1 = await request(app)
      .get('/api/v1/quotas')
      .set('x-test-cache', 'true');
    expect(res1.status).toBe(200);
    expect(res1.headers['x-cache']).toBe('MISS');

    // Second request: Cache HIT
    const res2 = await request(app)
      .get('/api/v1/quotas')
      .set('x-test-cache', 'true');
    expect(res2.status).toBe(200);
    expect(res2.headers['x-cache']).toBe('HIT');
    expect(res2.body.data.length).toBe(res1.body.data.length);
  });
});
