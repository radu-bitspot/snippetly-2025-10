/**
 * Custom fetch wrapper with configurable timeout
 * Default timeout: 10 minutes (600000ms) for long-running webhook operations
 *
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @param {number} timeout - Timeout in milliseconds (default: 600000ms = 10 minutes)
 * @returns {Promise} - Promise that resolves with the fetch response or rejects on timeout
 */
export const fetchWithTimeout = (url, options = {}, timeout = 600000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout - exceeded ${timeout / 60000} minutes`)), timeout)
    )
  ]);
};

// Export timeout constant for reuse
export const WEBHOOK_TIMEOUT = 600000; // 10 minutes in milliseconds
