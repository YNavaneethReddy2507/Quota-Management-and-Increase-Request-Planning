/**
 * Google Cloud Authentication Utility Module
 * Implements Application Default Credentials (ADC) and Bearer Token Acquisition
 * Quota Management and Increase Request Planning Control Plane
 */

const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// Scopes required for Quota Management, Monitoring, and Service Usage APIs
const SCOPES = ['https://www.googleapis.com/auth/cloud-platform'];

let cachedAuth = null;

/**
 * Initializes and returns the GoogleAuth instance.
 */
function initGoogleAuth() {
  if (cachedAuth) {
    return cachedAuth;
  }

  const options = {
    scopes: SCOPES,
  };

  // If credentials path specified in config exists, use it explicitly
  if (config.gcp.credentialsPath) {
    const resolvedPath = path.resolve(config.gcp.credentialsPath);
    if (fs.existsSync(resolvedPath)) {
      options.keyFilename = resolvedPath;
    }
  }

  cachedAuth = new GoogleAuth(options);
  return cachedAuth;
}

/**
 * Returns an authenticated Google Auth client.
 */
async function getGoogleAuthClient() {
  const auth = initGoogleAuth();
  try {
    return await auth.getClient();
  } catch (error) {
    console.warn(`[GCP AUTH WARNING] Failed to obtain ADC client: ${error.message}.`);
    // If running in development without credentials, return null or fallback
    return null;
  }
}

/**
 * Retrieves the resolved GCP Project ID from GoogleAuth or fallback configuration.
 */
async function getGcpProjectId() {
  if (config.gcp.projectId && config.gcp.projectId !== 'demo-gcp-project') {
    return config.gcp.projectId;
  }

  const auth = initGoogleAuth();
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Project ID detection timeout')), 500)
    );
    const projectId = await Promise.race([auth.getProjectId(), timeoutPromise]);
    if (projectId) return projectId;
  } catch (e) {
    // fallback gracefully
  }
  return config.gcp.projectId || 'enterprise-prod-finance-42';
}


/**
 * Acquires a fresh OAuth2 Bearer Access Token for outbound GCP REST API calls.
 * If credentials are not present, provides a mock-authorized development token.
 */
async function getGcpAccessToken() {
  try {
    const client = await getGoogleAuthClient();
    if (client) {
      const tokenResponse = await client.getAccessToken();
      const token = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;
      if (token) {
        return token;
      }
    }
  } catch (error) {
    console.warn(`[GCP AUTH WARNING] Error fetching live GCP access token: ${error.message}`);
  }

  // Graceful fallback token for local development or demo environments
  return 'ya29.DEMO_MOCK_GOOGLE_CLOUD_ACCESS_TOKEN_FOR_HACKATHON';
}

/**
 * Constructs standard authenticated HTTP headers for GCP API requests.
 */
async function getGcpHeaders() {
  const token = await getGcpAccessToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'GCP-Quota-Governance-ControlPlane/1.0',
  };
}

module.exports = {
  initGoogleAuth,
  getGoogleAuthClient,
  getGcpProjectId,
  getGcpAccessToken,
  getGcpHeaders,
};
