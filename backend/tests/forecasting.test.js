/**
 * Forecasting Engine Test Suite
 * Tests linear demand projections, exhaustion dates, and API endpoint integration.
 */

const request = require('supertest');
const app = require('../src/app');
const ForecastingService = require('../src/services/forecasting_service');

describe('Forecasting Engine & ForecastingService Suite', () => {
  test('forecastDemand computes accurate days to threshold and total exhaustion', () => {
    // Current usage = 80, limit = 100, burnRate = 2 units/day, threshold = 80% (80 units)
    // Already at threshold (0 days)
    const result = ForecastingService.forecastDemand({
      currentUsage: 80,
      quotaLimit: 100,
      dailyBurnRate: 2,
      horizonDays: 10,
      criticalThresholdPct: 80,
    });

    expect(result.isSufficientData).toBe(true);
    expect(result.daysToThresholdCrossing).toBe(0);
    expect(result.daysToTotalExhaustion).toBe(10); // 20 units remaining / 2 per day = 10 days
    expect(result.projections.length).toBe(10);
    expect(result.projectedUsageAtHorizon).toBe(100);
  });

  test('forecastDemand handles safe resource with non-zero days to threshold', () => {
    // Current usage = 50, limit = 100, burnRate = 2 units/day, threshold = 80% (80 units)
    // 30 units to threshold -> 15 days
    const result = ForecastingService.forecastDemand({
      currentUsage: 50,
      quotaLimit: 100,
      dailyBurnRate: 2,
      horizonDays: 30,
      criticalThresholdPct: 80,
    });

    expect(result.daysToThresholdCrossing).toBe(15);
    expect(result.daysToTotalExhaustion).toBe(25);
  });

  test('GET /api/v1/quotas/qm-001/forecast returns structured forecast response', async () => {
    const res = await request(app).get('/api/v1/quotas/qm-001/forecast?horizon_days=30');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.quota_metric_id).toBe('qm-001');
    expect(res.body.data).toHaveProperty('daysToThresholdCrossing');
    expect(res.body.data).toHaveProperty('projections');
    expect(res.body.data.projections.length).toBe(30);
  });
});
