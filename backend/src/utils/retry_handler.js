/**
 * Resilient Exponential Backoff Retry Handler
 * Automatically handles 429 Rate Limits and 5xx Transient Errors.
 * Quota Management and Increase Request Planning Control Plane
 */

const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];

/**
 * Executes an async operation with exponential backoff and jitter.
 *
 * @param {Function} asyncFn - Async operation to execute
 * @param {object} options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {number} options.initialDelayMs - Initial delay in ms (default: 500)
 * @param {number} options.backoffFactor - Multiplier per attempt (default: 2)
 * @param {string} options.operationName - Human-readable label for logging
 * @returns {Promise<any>}
 */
async function executeWithExponentialBackoff(
  asyncFn,
  {
    maxRetries = 3,
    initialDelayMs = 500,
    backoffFactor = 2,
    operationName = 'GCP Outbound Operation',
  } = {}
) {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      if (attempt > 0) {
        console.log(`[RETRY ENGINE] Executing attempt ${attempt}/${maxRetries} for '${operationName}'`);
      }
      return await asyncFn(attempt);
    } catch (error) {
      attempt++;
      const statusCode = error.status || error.response?.status;
      const isRetryable =
        RETRYABLE_STATUS_CODES.includes(statusCode) ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNREFUSED';

      if (!isRetryable || attempt > maxRetries) {
        console.error(
          `[RETRY EXHAUSTED / NON-RETRYABLE] Operation '${operationName}' failed permanently after ${attempt - 1} retries. ` +
          `Status: ${statusCode || 'N/A'}. Error: ${error.message}`,
          error.stack
        );
        throw error;
      }

      // Calculate exponential backoff with jitter
      const delay = Math.round(
        initialDelayMs * Math.pow(backoffFactor, attempt - 1) + Math.random() * 100
      );

      console.warn(
        `[RETRY WARNING] '${operationName}' encountered ${statusCode || 'transient error'}: ${error.message}. ` +
        `Backoff attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

module.exports = {
  executeWithExponentialBackoff,
  RETRYABLE_STATUS_CODES,
};
