/**
 * Main Server Entry Point
 * Quota Management and Increase Request Planning Control Plane
 */

const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`[INFO] Quota Governance Control Plane running on port ${config.port} (${config.env})`);
  console.log(`[INFO] Health check available at: http://localhost:${config.port}/api/v1/health`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[INFO] SIGTERM signal received. Closing HTTP server gracefully.');
  server.close(() => {
    console.log('[INFO] HTTP server closed.');
    process.exit(0);
  });
});

module.exports = server;
