/**
 * Recommendation Engine Test Suite
 * Tests capacity sizing, safety margin calculation, confidence scoring, and disclaimer validation.
 */

const request = require('supertest');
const app = require('../src/app');
const RecommendationService = require('../src/services/recommendation_service');

describe('Recommendation Engine & RecommendationService Suite', () => {
  test('generateRecommendation calculates target limit and additional capacity with safety margin', () => {
    // Current limit: 100, current usage: 92 (exceeds 80%), planned growth: 10
    // Demand = 92 + 10 = 102. Target with 25% margin = ceil(102 * 1.25) = 128
    const rec = RecommendationService.generateRecommendation({
      currentLimit: 100,
      currentUsage: 92,
      safetyMarginPct: 25,
      projectedGrowthUnits: 10,
    });

    expect(rec.recommendedLimit).toBe(128);
    expect(rec.additionalCapacity).toBe(28);
    expect(rec.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(rec.factors.length).toBeGreaterThan(0);
    expect(rec.disclaimer).toMatch(/Google Cloud approval/i);
  });


  test('generateRecommendation never reduces limit below current quota limit', () => {
    const rec = RecommendationService.generateRecommendation({
      currentLimit: 100,
      currentUsage: 10,
      safetyMarginPct: 20,
      projectedGrowthUnits: 0,
    });

    expect(rec.recommendedLimit).toBeGreaterThanOrEqual(100);
  });

  test('GET /api/v1/quotas/qm-001/recommendation returns complete recommendation payload', async () => {
    const res = await request(app).get('/api/v1/quotas/qm-001/recommendation?safety_margin_pct=30&growth_units=20');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.quota_metric_id).toBe('qm-001');
    expect(res.body.data).toHaveProperty('recommendedLimit');
    expect(res.body.data).toHaveProperty('factors');
  });
});
