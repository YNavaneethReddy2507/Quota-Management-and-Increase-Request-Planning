/**
 * In-Memory Response Caching Engine with Configurable TTL
 * Quota Management and Increase Request Planning Control Plane
 */

class ResponseCache {
  constructor(defaultTtlSeconds = 60) {
    this.defaultTtlMs = defaultTtlSeconds * 1000;
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlSeconds) {
    const ttlMs = (ttlSeconds !== undefined ? ttlSeconds : this.defaultTtlMs / 1000) * 1000;
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  clear() {
    this.store.clear();
  }

  get size() {
    return this.store.size;
  }

  /**
   * Express middleware factory for caching GET responses
   * @param {number} ttlSeconds
   */
  middleware(ttlSeconds = 60) {
    return (req, res, next) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Bypass cache in test environment unless specifically requested
      if (process.env.NODE_ENV === 'test' && !req.headers['x-test-cache']) {
        return next();
      }

      const cacheKey = `${req.originalUrl || req.url}`;
      const cachedResponse = this.get(cacheKey);

      if (cachedResponse) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cachedResponse);
      }

      // Intercept res.json to capture response
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode === 200 && body && body.success) {
          this.set(cacheKey, body, ttlSeconds);
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };

      next();
    };
  }
}

const quotaCache = new ResponseCache(60);

module.exports = {
  ResponseCache,
  quotaCache,
};
