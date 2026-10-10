/**
 * Outbound GCP Cloud Quotas API Submission Service
 * Dispatches automated quota increase requests to the GCP Cloud Quotas 'quotaPreferences' API.
 * Quota Management and Increase Request Planning Control Plane
 */

const axios = require('axios');
const { getGcpHeaders } = require('../utils/gcp_auth');

class GcpQuotaSubmissionService {
  /**
   * Constructs the official Google Cloud Quotas API quotaPreferences request payload.
   *
   * @param {object} params
   * @param {string} params.service - e.g. 'compute.googleapis.com'
   * @param {string} params.metricName - e.g. 'compute.googleapis.com/cpus'
   * @param {string} params.region - e.g. 'us-central1'
   * @param {number} params.requestedLimit - Target new quota limit
   * @param {string} params.justification - Business justification text
   * @param {string} params.requesterEmail - Engineer contact email
   * @returns {object} Formatted GCP Cloud Quotas API payload
   */
  static buildQuotaPreferencePayload({
    service,
    metricName,
    region,
    requestedLimit,
    justification,
    requesterEmail,
  }) {
    // Extract service and quota identifier from metric name
    const parts = metricName.split('/');
    const cleanService = service || parts[0] || 'compute.googleapis.com';
    const quotaId = parts[1] || 'cpus';

    return {
      service: cleanService,
      quotaId: quotaId,
      quotaConfig: {
        preferredValue: requestedLimit,
        annotations: {
          governance_plane: 'GCP-Quota-Management-System',
          submitted_at: new Date().toISOString(),
        },
      },
      dimensions: {
        region: region || 'global',
      },
      justification: justification || 'Requested via automated Quota Governance Control Plane',
      contactEmail: requesterEmail || 'cloud-engineer@enterprise.org',
    };
  }

  /**
   * Executes the authenticated POST request to GCP Cloud Quotas API.
   *
   * @param {object} params
   * @param {string} params.gcpProjectId - Target GCP project
   * @param {string} params.region - Target region
   * @param {string} params.metricName - Quota metric
   * @param {number} params.requestedLimit - Target limit
   * @param {string} params.justification - Business rationale
   * @param {string} params.requesterEmail - Requester email
   * @returns {Promise<object>} GCP API response
   */
  static async submitQuotaPreference({
    gcpProjectId,
    region = 'us-central1',
    metricName,
    requestedLimit,
    justification,
    requesterEmail,
  }) {
    const headers = await getGcpHeaders();
    const payload = this.buildQuotaPreferencePayload({
      service: 'compute.googleapis.com',
      metricName,
      region,
      requestedLimit,
      justification,
      requesterEmail,
    });

    const preferenceId = `pref-${Date.now()}`;
    const url = `https://cloudquotas.googleapis.com/v1/projects/${gcpProjectId}/locations/${region}/quotaPreferences?quotaPreferenceId=${preferenceId}`;

    console.log(`[OUTBOUND GCP QUOTA API] Submitting Quota Preference to GCP Cloud Quotas API:`);
    console.log(`[URL] ${url}`);
    console.log(`[PAYLOAD]`, JSON.stringify(payload, null, 2));

    try {
      const response = await axios.post(url, payload, {
        headers,
        timeout: 8000,
      });

      console.log(`[GCP QUOTA API SUCCESS] Quota preference accepted by GCP:`, response.data);
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      // If error is 429 or 5xx or local demo network failure, rethrow or handle for retry engine
      const statusCode = error.response ? error.response.status : (error.code === 'ECONNREFUSED' ? 503 : 500);
      console.warn(`[GCP QUOTA API ATTEMPT FAILED] Status: ${statusCode}, Message: ${error.message}`);
      
      const gcpError = new Error(`GCP Quotas API returned error: ${error.message}`);
      gcpError.status = statusCode;
      gcpError.response = error.response;
      throw gcpError;
    }
  }
}

module.exports = GcpQuotaSubmissionService;
