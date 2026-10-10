/**
 * Risk Assessment & Approval Confidence Scoring Service
 * Calculates an Approval Confidence Score (0-100) for quota increase requests.
 * Quota Management and Increase Request Planning Control Plane
 */

class RiskAssessmentService {
  /**
   * Calculates the Approval Confidence Score (0-100).
   * High utilization (e.g. 99%) yields high confidence (~100).
   * Low utilization (e.g. 10%) yields low confidence.
   *
   * @param {object} params
   * @param {number} params.currentUsage
   * @param {number} params.currentLimit
   * @param {number} params.requestedLimit
   * @param {number} params.utilizationPercentage
   * @param {string} params.justification
   * @returns {object} Score and audit breakdown
   */
  static calculateApprovalConfidenceScore({
    currentUsage,
    currentLimit,
    requestedLimit,
    utilizationPercentage,
    justification = '',
  }) {
    const util = Math.max(0, utilizationPercentage || (currentLimit > 0 ? (currentUsage / currentLimit) * 100 : 0));

    // 1. Utilization Necessity Component (0 - 75 points)
    let utilizationScore = 0;
    if (util >= 90) {
      // 90% -> 70 pts; 99% -> 74.5 pts; 100% -> 75 pts
      utilizationScore = 70 + Math.min(5, (util - 90) * 0.5);
    } else if (util >= 80) {
      // 80% -> 58 pts; 89% -> ~68 pts
      utilizationScore = 58 + ((util - 80) / 10) * 11;
    } else if (util >= 60) {
      // 60% -> 38 pts; 79% -> ~56 pts
      utilizationScore = 38 + ((util - 60) / 20) * 19;
    } else if (util >= 30) {
      // 30% -> 18 pts; 59% -> ~36 pts
      utilizationScore = 18 + ((util - 30) / 30) * 19;
    } else {
      // 10% -> 6 pts; 0% -> 0 pts
      utilizationScore = (util / 30) * 18;
    }

    // 2. Request Multiplier Factor (0 - 15 points)
    // Moderate increase factor (e.g. 1.2x to 3x) receives higher approval rating than 50x request
    const multiplier = currentLimit > 0 ? requestedLimit / currentLimit : 1;
    let multiplierScore = 15;
    if (multiplier > 10) {
      multiplierScore = 3;
    } else if (multiplier > 5) {
      multiplierScore = 8;
    } else if (multiplier > 3) {
      multiplierScore = 12;
    }

    // 3. Business Justification Clarity Factor (0 - 10 points)
    const justLength = justification.trim().length;
    let justificationScore = 5;
    if (justLength >= 60) {
      justificationScore = 10;
    } else if (justLength >= 25) {
      justificationScore = 8;
    }

    // Aggregate and normalize (0 to 100)
    const rawTotal = utilizationScore + multiplierScore + justificationScore;
    const finalScore = Math.min(100, Math.max(0, Math.round(rawTotal)));

    // Categorization
    let category = 'LOW_CONFIDENCE';
    let recommendation = 'Manual architecture review required. Resource utilization is well below critical saturation.';
    if (finalScore >= 80) {
      category = 'HIGH_CONFIDENCE';
      recommendation = 'Strongly recommended for approval. Resource is actively saturated and risks production disruption.';
    } else if (finalScore >= 55) {
      category = 'MODERATE_CONFIDENCE';
      recommendation = 'Moderate priority. Resource approaching threshold; review projected growth plans.';
    }

    return {
      score: finalScore,
      category,
      recommendation,
      breakdown: {
        utilizationScore: parseFloat(utilizationScore.toFixed(1)),
        multiplierScore,
        justificationScore,
        currentUtilization: parseFloat(util.toFixed(2)),
        expansionMultiplier: parseFloat(multiplier.toFixed(2)),
      },
    };
  }
}

module.exports = RiskAssessmentService;
