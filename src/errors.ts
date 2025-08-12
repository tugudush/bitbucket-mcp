/**
 * Custom error classes for better error handling and user feedback
 */

export class BitbucketApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public details?: string,
    public suggestion?: string
  ) {
    super(
      `Bitbucket API error: ${status} ${statusText}${details ? ` - ${details}` : ''}`
    );
    this.name = 'BitbucketApiError';
  }
}

export class AuthenticationError extends BitbucketApiError {
  constructor(details?: string) {
    super(
      401,
      'Unauthorized',
      details,
      'Check your authentication credentials (BITBUCKET_API_TOKEN + BITBUCKET_EMAIL or BITBUCKET_USERNAME + BITBUCKET_APP_PASSWORD)'
    );
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends BitbucketApiError {
  constructor(resource: string) {
    super(
      404,
      'Not Found',
      `The requested ${resource} was not found`,
      'Check the workspace/repository names and ensure you have access'
    );
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends BitbucketApiError {
  constructor(resource?: string) {
    super(
      403,
      'Forbidden',
      resource ? `Access denied to ${resource}` : 'Access denied',
      'Your credentials may not have sufficient permissions for this resource'
    );
    this.name = 'ForbiddenError';
  }
}

export class RateLimitError extends BitbucketApiError {
  constructor() {
    super(
      429,
      'Too Many Requests',
      'Rate limit exceeded',
      'Please wait before retrying'
    );
    this.name = 'RateLimitError';
  }
}

/**
 * Creates appropriate error instance based on HTTP status code
 */
export function createApiError(
  status: number,
  statusText: string,
  errorData?: {
    error?: { message?: string; detail?: string };
    message?: string;
  },
  url?: string
): BitbucketApiError {
  let details = '';

  // Try to extract error details from response
  if (errorData) {
    if (errorData.error?.message) {
      details = errorData.error.message;
      if (errorData.error.detail) {
        details += ` (${errorData.error.detail})`;
      }
    } else if (errorData.message) {
      details = errorData.message;
    }
  }

  // Extract resource type from URL for better error messages
  const resource = extractResourceFromUrl(url);

  switch (status) {
    case 401:
      return new AuthenticationError(details);
    case 403:
      return new ForbiddenError(resource);
    case 404:
      return new BitbucketApiError(
        404,
        'Not Found',
        details || `The requested ${resource || 'resource'} was not found`,
        'Check the workspace/repository names and ensure you have access'
      );
    case 429:
      return new RateLimitError();
    default:
      return new BitbucketApiError(status, statusText, details);
  }
}

/**
 * Extracts resource type from Bitbucket API URL for better error messages
 */
function extractResourceFromUrl(url?: string): string | undefined {
  if (!url) return undefined;

  const patterns = [
    { pattern: /\/repositories\/[^/]+\/[^/]+$/, resource: 'repository' },
    {
      pattern: /\/repositories\/[^/]+\/[^/]+\/pullrequests/,
      resource: 'pull request',
    },
    { pattern: /\/repositories\/[^/]+\/[^/]+\/issues/, resource: 'issue' },
    { pattern: /\/repositories\/[^/]+\/[^/]+\/src/, resource: 'file' },
    { pattern: /\/repositories\/[^/]+\/[^/]+\/commits/, resource: 'commit' },
    { pattern: /\/repositories\/[^/]+\/[^/]+\/refs/, resource: 'branch' },
    { pattern: /\/workspaces\/[^/]+$/, resource: 'workspace' },
    { pattern: /\/user/, resource: 'user' },
  ];

  for (const { pattern, resource } of patterns) {
    if (pattern.test(url)) {
      return resource;
    }
  }

  return 'resource';
}
