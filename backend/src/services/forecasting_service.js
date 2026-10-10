/**
 * Demand Forecasting Engine (ForecastingService)
 * Implements baseline linear projection, trend extrapolation, and threshold exhaustion estimation.
 * Quota Management and Increase Request Planning Control Plane
 */

class ForecastingService {
  /**
   * Forecasts future resource demand and estimates threshold breach dates.
   *
   * @param {object} params
   * @param {number} params.currentUsage - Current observed resource usage
   * @param {number} params.quotaLimit - Current quota limit ceiling
   * @param {number} [params.dailyBurnRate] - Daily growth rate (in units/day). Defaults to 2.5% of current usage
   * @param {number} [params.horizonDays=30] - Forecast horizon in days
   * @param {number} [params.criticalThresholdPct=80.0] - Warning/critical saturation threshold
   * @returns {object} Structured forecast analysis
   */
  static forecastDemand({
    currentUsage,
    quotaLimit,
    dailyBurnRate = null,
    horizonDays = 30,
    criticalThresholdPct = 80.0,
  }) {
    if (!quotaLimit || quotaLimit <= 0) {
      return {
        isSufficientData: false,
        error: 'Invalid or missing quota limit',
      };
    }

    const safeUsage = Math.max(0, currentUsage || 0);
    // If dailyBurnRate not supplied, derive baseline from 2% growth/day
    const burnRate = dailyBurnRate !== null && dailyBurnRate !== undefined
      ? dailyBurnRate
      : parseFloat((safeUsage * 0.02).toFixed(3));

    const thresholdLimit = (quotaLimit * criticalThresholdPct) / 100.0;
    const remainingToThreshold = thresholdLimit - safeUsage;

    let daysToThreshold = null;
    let daysToTotalExhaustion = null;

    if (burnRate > 0) {
      if (remainingToThreshold <= 0) {
        daysToThreshold = 0; // Already crossed
      } else {
        daysToThreshold = Math.ceil(remainingToThreshold / burnRate);
      }

      const remainingToTotal = quotaLimit - safeUsage;
      daysToTotalExhaustion = remainingToTotal <= 0 ? 0 : Math.ceil(remainingToTotal / burnRate);
    }

    // Generate daily projected time-series
    const projections = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let day = 1; day <= horizonDays; day++) {
      const projectedUsage = parseFloat((safeUsage + burnRate * day).toFixed(2));
      const projectedPct = parseFloat(((projectedUsage / quotaLimit) * 100).toFixed(2));
      projections.push({
        day,
        projectedDate: new Date(now + day * dayMs).toISOString().split('T')[0],
        projectedUsage,
        projectedUtilizationPct: projectedPct,
        isOverThreshold: projectedPct >= criticalThresholdPct,
        isOverLimit: projectedUsage > quotaLimit,
      });
    }

    return {
      isSufficientData: true,
      currentUsage: safeUsage,
      quotaLimit,
      currentUtilizationPct: parseFloat(((safeUsage / quotaLimit) * 100).toFixed(2)),
      dailyBurnRate: burnRate,
      criticalThresholdPct,
      daysToThresholdCrossing: daysToThreshold,
      daysToTotalExhaustion,
      projectedUsageAtHorizon: projections[projections.length - 1]?.projectedUsage || safeUsage,
      projectedUtilizationAtHorizonPct: projections[projections.length - 1]?.projectedUtilizationPct || 0,
      modelAssumptions: 'Baseline Linear Trend Extrapolation with Constant Daily Velocity',
      projections,
    };
  }
}

module.exports = ForecastingService;
