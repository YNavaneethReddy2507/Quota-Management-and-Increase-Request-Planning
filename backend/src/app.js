/**
 * Express Application Configuration
 * Quota Management and Increase Request Planning Control Plane
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');

const app = express();

// Configure strict CORS middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const { securityHeaders, rateLimiter } = require('./middleware/security');

// Security headers
app.use(securityHeaders);

// Rate limiting middleware
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 200 }));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin) || config.env === 'development') {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not permitted by CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Role'],
  })
);

// Logging middleware
if (config.env !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing middleware with strict size caps
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health Check Endpoint (Liveness)
app.get('/api/v1/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'gcp-quota-governance-engine',
    version: '1.0.0',
    environment: config.env,
  });
});

// Detailed Component Health & Readiness Endpoint
const { quotaCache } = require('./utils/cache');
const { db } = require('./db');
app.get('/api/v1/health/detailed', (req, res) => {
  const mem = process.memoryUsage();
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    components: {
      database: {
        status: 'UP',
        engine: db.isPrismaConnected ? 'MySQL/Prisma' : 'In-Memory Resilient Fallback',
      },
      quota_cache: {
        status: 'UP',
        active_cached_keys: quotaCache.size,
      },
      memory: {
        heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
        rss_mb: Math.round(mem.rss / 1024 / 1024),
      },
    },
  });
});

// Mount REST API Routers
const projectsRouter = require('./routes/projects');
const quotasRouter = require('./routes/quotas');
const requestsRouter = require('./routes/requests');
const settingsRouter = require('./routes/settings');

app.use('/api/v1/projects', projectsRouter);
app.use('/api/v1/quotas', quotasRouter);
app.use('/api/v1/requests', requestsRouter);
app.use('/api/v1/settings', settingsRouter);

// GET /api/v1/notifications - In-App Alert and Webhook Audit History
const NotificationService = require('./services/notification_service');
app.get('/api/v1/notifications', (req, res) => {
  const alerts = NotificationService.getAlertHistory();
  return res.status(200).json({
    success: true,
    count: alerts.length,
    data: alerts,
  });
});

// Catch-all 404 handler for API routes

app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Resource at ${req.method} ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString()
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected server error occurred',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;

