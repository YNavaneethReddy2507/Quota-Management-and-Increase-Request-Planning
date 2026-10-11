/**
 * Security Middleware: Security Headers & Rate Limiting
 * Implements Defense-in-Depth protections for Cloud Quotas Control Plane
 */

// In-memory sliding window rate limiter
const rateLimitStore = new Map();

/**
 * Factory for rate limiting middleware
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 mins)
 * @param {number} options.max - Max allowed requests per window (default: 200)
 */
function rateLimiter(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const max = options.max || 200;

  return (req, res, next) => {
    // In test environment, allow high throughput unless specifically testing rate limiter
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const now = Date.now();

    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, []);
    }

    // Filter timestamps within the window
    const timestamps = rateLimitStore.get(ip).filter((ts) => now - ts < windowMs);
    rateLimitStore.set(ip, timestamps);

    const currentCount = timestamps.length;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - currentCount - 1));

    if (currentCount >= max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({
        error: 'TooManyRequests',
        message: 'Rate limit exceeded. Too many requests submitted in the active governance window.',
        retry_after_seconds: Math.ceil(windowMs / 1000),
      });
    }

    timestamps.push(now);
    return next();
  };
}

/**
 * HTTP Security Headers Middleware (OWASP recommended defense)
 */
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;"
  );
  next();
}

module.exports = {
  rateLimiter,
  securityHeaders,
  rateLimitStore,
};
