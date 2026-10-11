/**
 * Google Cloud Quota Request Workflow Test Suite
 * Tests quota preference payload structure, dimensions, and outbound submission error handling.
 */

const GcpQuotaSubmissionService = require('../src/services/gcp_quota_submission_service');

describe('Google Cloud Request Workflow Suite', () => {
  test('buildQuotaPreferencePayload constructs valid Google Cloud Quotas API payload', () => {
    const payload = GcpQuotaSubmissionService.buildQuotaPreferencePayload({
      service: 'compute.googleapis.com',
      metricName: 'compute.googleapis.com/cpus',
      region: 'us-central1',
      requestedLimit: 256,
      justification: 'Quarterly analytics processing requirement',
      requesterEmail: 'lead.architect@enterprise.org',
    });

    expect(payload).toBeDefined();
    expect(payload.service).toBe('compute.googleapis.com');
    expect(payload.quotaId).toBe('cpus');
    expect(payload.quotaConfig.preferredValue).toBe(256);
    expect(payload.dimensions.region).toBe('us-central1');
    expect(payload.contactEmail).toBe('lead.architect@enterprise.org');
    expect(payload.justification).toContain('Quarterly analytics processing');
  });

  test('buildQuotaPreferencePayload extracts service and quotaId from full metric name', () => {
    const payload = GcpQuotaSubmissionService.buildQuotaPreferencePayload({
      metricName: 'compute.googleapis.com/nvidia_h100_gpus',
      region: 'europe-west1',
      requestedLimit: 32,
    });

    expect(payload.service).toBe('compute.googleapis.com');
    expect(payload.quotaId).toBe('nvidia_h100_gpus');
    expect(payload.dimensions.region).toBe('europe-west1');
  });
});
