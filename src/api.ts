import { loadConfig } from './config.js';
import { createApiError } from './errors.js';
import { API_CONSTANTS } from './schemas.js';

/**
 * Bitbucket API configuration and request handling
 */

// Initialize configuration
const config = loadConfig();

// Bitbucket API base URL
export const BITBUCKET_API_BASE = config.BITBUCKET_API_BASE;

/**
 * Helper function to make authenticated requests to Bitbucket API
 * Enforces read-only behavior by blocking non-GET requests
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

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'bitbucket-mcp-server/1.0.0',
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add authentication if available
  // Priority: API Token (Basic auth with email) > App Password (Basic auth with username)
  const apiToken = config.BITBUCKET_API_TOKEN;
  const email = config.BITBUCKET_EMAIL;
  const username = config.BITBUCKET_USERNAME;
  const appPassword = config.BITBUCKET_APP_PASSWORD;

  if (apiToken && email) {
    // Use API Token with Basic authentication (recommended)
    // Username should be your Atlassian email, password is the API token
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    headers.Authorization = `Basic ${auth}`;
  } else if (username && appPassword) {
    // Fallback to App Password with Basic authentication (legacy)
    const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
    headers.Authorization = `Basic ${auth}`;
  }

  const response = await fetch(url, {
    ...options,
    // Force GET to prevent accidental method overrides downstream
    method: 'GET',
    headers,
  });

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

    // Create and throw appropriate error type
    throw createApiError(response.status, response.statusText, errorData, url);
  }

  return await response.json();
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
