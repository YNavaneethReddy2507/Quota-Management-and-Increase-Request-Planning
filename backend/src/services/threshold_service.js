/**
 * Threshold & Utilization Calculation Service (ThresholdService)
 * Computes utilization percentage: (current_usage / quota_limit) * 100
 * Flags high-risk resources (>= 80%) in logs and updates MySQL database.
 * Quota Management and Increase Request Planning Control Plane
 */

const { db } = require('../db');
const config = require('../config');

class ThresholdService {
  /**
   * Pure calculation function: calculates utilization percentage given usage and limit.
   * Formula: (current_usage / quota_limit) * 100
   *
   * @param {number} currentUsage - Current resource consumption
   * @param {number} quotaLimit - Maximum allowed quota ceiling
   * @returns {number} Rounded utilization percentage (0 - 100+)
   */
  static calculateUtilizationPercentage(currentUsage, quotaLimit) {
    if (!quotaLimit || quotaLimit <= 0) {
      return 0.0;
    }
    if (!currentUsage || currentUsage < 0) {
      return 0.0;
    }
    const rawPercentage = (currentUsage / quotaLimit) * 100.0;
    return parseFloat(rawPercentage.toFixed(2));
  }

  /**
   * Evaluates the risk category for a given utilization percentage.
   *
   * @param {number} utilizationPercentage
   * @returns {'CRITICAL' | 'HIGH' | 'MODERATE' | 'NORMAL'}
   */
  static getRiskLevel(utilizationPercentage) {
    if (utilizationPercentage >= 90.0) return 'CRITICAL';
    if (utilizationPercentage >= config.thresholds.highRiskPercent) return 'HIGH';
    if (utilizationPercentage >= config.thresholds.moderateRiskPercent) return 'MODERATE';
    return 'NORMAL';
  }

  /**
   * Checks whether a utilization percentage is flagged as high risk (>= 80%).
   *
   * @param {number} utilizationPercentage
   * @returns {boolean}
   */
  static isHighRisk(utilizationPercentage) {
    return utilizationPercentage >= config.thresholds.highRiskPercent;
  }

  /**
   * Recalculates utilization percentages for all metrics in the database,
   * flags high-risk resources (>= 80%) in application logs, and saves updates.
   *
   * @returns {Promise<object>} Summary of threshold evaluation
   */
  static async recalculateAllThresholds() {
    console.log('[THRESHOLD SERVICE] Evaluating utilization thresholds across all monitored quota metrics...');
    const allMetrics = await db.quota_metrics.findMany();
    const highRiskMetrics = [];
    let updatedCount = 0;

    for (const metric of allMetrics) {
      const percentage = this.calculateUtilizationPercentage(
        metric.current_usage,
        metric.quota_limit
      );

      const highRisk = this.isHighRisk(percentage);

      if (highRisk) {
        console.warn(
          `[HIGH-RISK ALERT] Metric '${metric.metric_name}' in region '${metric.region}' ` +
          `(Project ID: ${metric.project_id}) has reached ${percentage}% utilization! ` +
          `Usage: ${metric.current_usage} / Limit: ${metric.quota_limit}. IMMEDIATE ATTENTION REQUIRED.`
        );

        highRiskMetrics.push({
          id: metric.id,
          metric_name: metric.metric_name,
          region: metric.region,
          project_id: metric.project_id,
          current_usage: metric.current_usage,
          quota_limit: metric.quota_limit,
          utilization_percentage: percentage,
          risk_level: this.getRiskLevel(percentage),
        });
      }

      // Update in MySQL
      await db.quota_metrics.update({
        where: { id: metric.id },
        data: {
          utilization_percentage: percentage,
        },
      });

      updatedCount++;
    }

    console.log(
      `[THRESHOLD SERVICE COMPLETE] Evaluated ${updatedCount} metrics. ` +
      `Identified ${highRiskMetrics.length} high-risk quota metrics (>= ${config.thresholds.highRiskPercent}%).`
    );

    return {
      totalEvaluated: updatedCount,
      highRiskCount: highRiskMetrics.length,
      highRiskMetrics,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = ThresholdService;
