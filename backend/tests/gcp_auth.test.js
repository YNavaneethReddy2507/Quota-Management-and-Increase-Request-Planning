/**
 * Google Cloud Authentication Utility Test Suite
 * Tests ADC client initialization, fallback handling, header generation, and project retrieval.
 */

const {
  initGoogleAuth,
  getGoogleAuthClient,
  getGcpProjectId,
  getGcpAccessToken,
  getGcpHeaders,
} = require('../src/utils/gcp_auth');

describe('Google Cloud Authentication Utility Suite', () => {
  test('initGoogleAuth returns a valid GoogleAuth instance', () => {
    const auth = initGoogleAuth();
    expect(auth).toBeDefined();
    expect(typeof auth.getClient).toBe('function');
  });

  test('getGcpProjectId returns configured project ID or fallback string', async () => {
    const projectId = await getGcpProjectId();
    expect(projectId).toBeDefined();
    expect(typeof projectId).toBe('string');
    expect(projectId.length).toBeGreaterThan(0);
  });

  test('getGcpAccessToken returns non-empty token string in all environments', async () => {
    const token = await getGcpAccessToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);
  });

  test('getGcpHeaders constructs valid authenticated headers with Bearer token', async () => {
    const headers = await getGcpHeaders();
    expect(headers).toBeDefined();
    expect(headers.Authorization).toMatch(/^Bearer\s+/);
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['User-Agent']).toContain('GCP-Quota-Governance');
  });
});
