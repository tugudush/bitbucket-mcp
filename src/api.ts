import { loadConfig, Config } from './config.js';
import { createApiError } from './errors.js';
import { API_CONSTANTS } from './schemas.js';

/**
 * Bitbucket API configuration and request handling
 */

// Package version - kept in sync with package.json
export const VERSION = '1.5.1';

// Get config dynamically to handle environment changes
function getConfig() {
  return loadConfig();
}

// Bitbucket API base URL
export const BITBUCKET_API_BASE = 'https://api.bitbucket.org/2.0';

/**
 * Build authentication headers based on available credentials
 * Priority: API Token (with email) > App Password (with username)
 * @param config - Configuration object (optional, will load from env if not provided)
 * @returns Headers object with Authorization if credentials available
 */
export function buildAuthHeaders(config?: Config): Record<string, string> {
  const cfg = config || getConfig();
  const headers: Record<string, string> = {};

  if (cfg.BITBUCKET_API_TOKEN && cfg.BITBUCKET_EMAIL) {
    // Use API Token with Basic authentication
    const auth = Buffer.from(
      `${cfg.BITBUCKET_EMAIL}:${cfg.BITBUCKET_API_TOKEN}`
    ).toString('base64');
    headers.Authorization = `Basic ${auth}`;
  }

  return headers;
}

/**
 * Build standard request headers for Bitbucket API
 * @param accept - Accept header value (default: 'application/json')
 * @param config - Configuration object (optional)
 * @returns Complete headers object
 */
export function buildRequestHeaders(
  accept: string = 'application/json',
  config?: Config
): Record<string, string> {
  return {
    Accept: accept,
    'User-Agent': `bitbucket-mcp-server/${VERSION}`,
    ...buildAuthHeaders(config),
  };
}

/**
 * Check if an error is retryable (transient failures)
 */
function isRetryableError(status: number): boolean {
  // Retry on server errors (5xx) and rate limiting (429)
  return status >= 500 || status === 429;
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper function to make authenticated requests to Bitbucket API
 * Enforces read-only behavior by blocking non-GET requests
 * Includes timeout and retry logic for improved reliability
 */
export async function makeRequest<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Enforce read-only behavior: block any non-GET methods at runtime
  const requestedMethod = (options.method || 'GET').toString().toUpperCase();
  if (requestedMethod !== 'GET') {
    throw new Error(
      `Only GET requests are allowed. Attempted: ${requestedMethod} ${url}`
    );
  }

  const config = getConfig();
  const headers: Record<string, string> = {
    ...buildRequestHeaders('application/json', config),
    ...((options.headers as Record<string, string>) || {}),
  };

  const timeout = config.BITBUCKET_REQUEST_TIMEOUT;
  let lastError: Error | null = null;

  // Retry loop for transient failures
  for (let attempt = 1; attempt <= API_CONSTANTS.RETRY_ATTEMPTS; attempt++) {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        // Force GET to prevent accidental method overrides downstream
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();

        // Try to parse error details
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          // If JSON parsing fails, use raw error text
          errorData = { message: errorText };
        }

        // Check if we should retry
        if (
          isRetryableError(response.status) &&
          attempt < API_CONSTANTS.RETRY_ATTEMPTS
        ) {
          // Exponential backoff: 1s, 2s, 4s...
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          await sleep(backoffMs);
          lastError = createApiError(
            response.status,
            response.statusText,
            errorData,
            url
          );
          continue;
        }

        // Create and throw appropriate error type
        throw createApiError(
          response.status,
          response.statusText,
          errorData,
          url
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort/timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new Error(`Request timeout after ${timeout}ms: ${url}`);
        if (attempt < API_CONSTANTS.RETRY_ATTEMPTS) {
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          await sleep(backoffMs);
          continue;
        }
        throw lastError;
      }

      // Re-throw non-retryable errors
      throw error;
    }
  }

  // Should not reach here, but throw last error if we do
  throw (
    lastError ||
    new Error(`Request failed after ${API_CONSTANTS.RETRY_ATTEMPTS} attempts`)
  );
}

/**
 * Make an authenticated request that returns raw text (not JSON).
 * Used for diff endpoints that return text/plain content.
 * Follows redirects automatically (PR diff endpoints return 302).
 */
export async function makeTextRequest(
  url: string,
  options: RequestInit = {}
): Promise<string> {
  // Enforce read-only behavior
  const requestedMethod = (options.method || 'GET').toString().toUpperCase();
  if (requestedMethod !== 'GET') {
    throw new Error(
      `Only GET requests are allowed. Attempted: ${requestedMethod} ${url}`
    );
  }

  const config = getConfig();
  const headers: Record<string, string> = {
    ...buildRequestHeaders('text/plain', config),
    ...((options.headers as Record<string, string>) || {}),
  };

  const timeout = config.BITBUCKET_REQUEST_TIMEOUT;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= API_CONSTANTS.RETRY_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        method: 'GET',
        headers,
        signal: controller.signal,
        redirect: 'follow', // Follow 302 redirects from PR diff endpoints
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        if (
          isRetryableError(response.status) &&
          attempt < API_CONSTANTS.RETRY_ATTEMPTS
        ) {
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          await sleep(backoffMs);
          lastError = createApiError(
            response.status,
            response.statusText,
            errorData,
            url
          );
          continue;
        }

        throw createApiError(
          response.status,
          response.statusText,
          errorData,
          url
        );
      }

      return await response.text();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new Error(`Request timeout after ${timeout}ms: ${url}`);
        if (attempt < API_CONSTANTS.RETRY_ATTEMPTS) {
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          await sleep(backoffMs);
          continue;
        }
        throw lastError;
      }

      throw error;
    }
  }

  throw (
    lastError ||
    new Error(`Request failed after ${API_CONSTANTS.RETRY_ATTEMPTS} attempts`)
  );
}

/**
 * Build URL for Bitbucket API endpoints
 */
export function buildApiUrl(endpoint: string): string {
  return `${BITBUCKET_API_BASE}${endpoint}`;
}

/**
 * Helper to build URL parameters for pagination and filtering
 */
export function buildUrlParams(
  params: Record<string, unknown>
): URLSearchParams {
  const urlParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // Handle pagination limits
      if ((key === 'pagelen' || key === 'limit') && typeof value === 'number') {
        const limitedValue = Math.min(value, API_CONSTANTS.MAX_PAGE_SIZE);
        urlParams.append(key, limitedValue.toString());
      } else {
        urlParams.append(key, String(value));
      }
    }
  });

  return urlParams;
}

/**
 * Helper to add query parameters to URL
 */
export function addQueryParams(
  url: string,
  params: Record<string, unknown>
): string {
  const urlParams = buildUrlParams(params);
  const paramString = urlParams.toString();

  if (!paramString) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${paramString}`;
}
