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

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'gcp-quota-governance-engine',
    version: '1.0.0',
    environment: config.env,
  });
});

// Mount REST API Routers
const projectsRouter = require('./routes/projects');
const quotasRouter = require('./routes/quotas');

app.use('/api/v1/projects', projectsRouter);
app.use('/api/v1/quotas', quotasRouter);

module.exports = app;
