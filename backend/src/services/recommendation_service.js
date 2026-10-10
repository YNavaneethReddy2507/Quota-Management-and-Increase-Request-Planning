/**
 * Capacity Recommendation Engine (RecommendationService)
 * Calculates mathematically sound quota increase limits with safety margins and justification factors.
 * Quota Management and Increase Request Planning Control Plane
 */

class RecommendationService {
  /**
   * Generates a recommended target quota limit with safety buffers and explicit explanatory factors.
   *
   * @param {object} params
   * @param {number} params.currentLimit - Current quota limit ceiling
   * @param {number} params.currentUsage - Current observed resource consumption
   * @param {number} [params.safetyMarginPct=25.0] - Desired safety margin above projected demand (e.g., 20%, 25%, 50%)
   * @param {number} [params.projectedGrowthUnits=0] - Expected additional demand from planned workloads
   * @returns {object} Comprehensive capacity recommendation
   */
  static generateRecommendation({
    currentLimit,
    currentUsage,
    safetyMarginPct = 25.0,
    projectedGrowthUnits = 0,
  }) {
    if (!currentLimit || currentLimit <= 0) {
      throw new Error('Current quota limit must be a positive number');
    }

    const safeUsage = Math.max(0, currentUsage || 0);
    const growth = Math.max(0, projectedGrowthUnits);
    const margin = Math.max(0, safetyMarginPct) / 100.0;

    // Base estimated demand = current usage + planned growth
    const estimatedBaseDemand = safeUsage + growth;

    // If demand exceeds 70% of current limit or already exceeds limit, calculate expansion
    const targetWithMargin = Math.ceil(estimatedBaseDemand * (1 + margin));

    // Target must never be less than currentLimit
    const recommendedLimit = Math.max(currentLimit, targetWithMargin);
    const additionalCapacity = recommendedLimit - currentLimit;
    const safetyHeadroom = recommendedLimit - estimatedBaseDemand;

    // Explainable score factors
    const factors = [];
    let confidenceScore = 80;

    if (safeUsage / currentLimit >= 0.8) {
      factors.push({
        factor: 'High Current Saturation',
        weight: 'Critical',
        description: `Current utilization (${((safeUsage / currentLimit) * 100).toFixed(1)}%) exceeds 80% risk threshold.`,
      });
      confidenceScore += 12;
    }

    if (growth > 0) {
      factors.push({
        factor: 'Planned Workload Expansion',
        weight: 'High',
        description: `Accounted for ${growth} units of anticipated workload expansion.`,
      });
      confidenceScore += 5;
    }

    factors.push({
      factor: 'Safety Margin Headroom',
      weight: 'Medium',
      description: `Applied ${safetyMarginPct}% safety buffer (${safetyHeadroom.toFixed(0)} units headroom) to prevent future starvation.`,
    });

    confidenceScore = Math.min(99, Math.max(50, confidenceScore));

    return {
      currentLimit,
      currentUsage: safeUsage,
      estimatedBaseDemand,
      safetyMarginPct,
      recommendedLimit,
      additionalCapacity,
      safetyHeadroom: parseFloat(safetyHeadroom.toFixed(2)),
      confidenceScore,
      factors,
      disclaimer: 'Notice: Algorithmic capacity recommendations are advisory and do not constitute or guarantee Google Cloud approval.',
    };
  }
}

module.exports = RecommendationService;
