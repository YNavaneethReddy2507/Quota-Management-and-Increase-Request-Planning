/**
 * Unit Tests: Threshold & Utilization Calculation Logic
 * Tests mathematical formulas, percentage precision, and risk saturation flags.
 * Quota Management and Increase Request Planning Control Plane
 */

const ThresholdService = require('../src/services/threshold_service');

describe('Threshold & Utilization Calculation Logic', () => {
  describe('Mathematical Precision & Formula: (current_usage / quota_limit) * 100', () => {
    test('calculates correct utilization percentage for standard usage', () => {
      const percentage = ThresholdService.calculateUtilizationPercentage(50, 100);
      expect(percentage).toBe(50.0);
    });

    test('calculates accurate float precision rounded to 2 decimals', () => {
      const percentage = ThresholdService.calculateUtilizationPercentage(104, 128);
      // (104 / 128) * 100 = 81.25%
      expect(percentage).toBe(81.25);
    });

    test('handles zero usage gracefully without NaN or negative values', () => {
      const percentage = ThresholdService.calculateUtilizationPercentage(0, 100);
      expect(percentage).toBe(0.0);
    });

    test('handles zero or invalid quota limit gracefully without division by zero', () => {
      expect(ThresholdService.calculateUtilizationPercentage(10, 0)).toBe(0.0);
      expect(ThresholdService.calculateUtilizationPercentage(10, -5)).toBe(0.0);
    });

    test('handles over-quota saturation scenario (usage exceeding limit)', () => {
      const percentage = ThresholdService.calculateUtilizationPercentage(150, 100);
      expect(percentage).toBe(150.0);
    });
  });

  describe('Threshold Alert Flagging & Risk Classification Logic', () => {
    test('flags resource as high risk when utilization is exactly 80%', () => {
      expect(ThresholdService.isHighRisk(80.0)).toBe(true);
      expect(ThresholdService.getRiskLevel(80.0)).toBe('HIGH');
    });

    test('flags resource as critical risk when utilization reaches >= 90%', () => {
      expect(ThresholdService.isHighRisk(93.75)).toBe(true);
      expect(ThresholdService.getRiskLevel(93.75)).toBe('CRITICAL');
    });

    test('does NOT flag resource when utilization is below 80%', () => {
      expect(ThresholdService.isHighRisk(79.9)).toBe(false);
      expect(ThresholdService.isHighRisk(50.0)).toBe(false);
      expect(ThresholdService.getRiskLevel(70.0)).toBe('MODERATE');
      expect(ThresholdService.getRiskLevel(45.0)).toBe('NORMAL');
    });

    test('boundary and invalid-data handling: classifies null, undefined, or NaN as UNKNOWN', () => {
      expect(ThresholdService.getRiskLevel(null)).toBe('UNKNOWN');
      expect(ThresholdService.getRiskLevel(undefined)).toBe('UNKNOWN');
      expect(ThresholdService.getRiskLevel(NaN)).toBe('UNKNOWN');
      expect(ThresholdService.isHighRisk(null)).toBe(false);
      expect(ThresholdService.isHighRisk(undefined)).toBe(false);
      expect(ThresholdService.isHighRisk(NaN)).toBe(false);
    });
  });
});

