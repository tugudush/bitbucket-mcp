// Suggested improvement: Custom error classes for better error handling

export class BitbucketApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public details?: string,
    public suggestion?: string
  ) {
    super(`Bitbucket API error: ${status} ${statusText}${details ? ` - ${details}` : ''}`);
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

// Enhanced makeRequest with custom errors and retry logic
export async function makeRequestWithRetry<T = unknown>(
  url: string,
  options: RequestInit = {},
  maxRetries = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await makeRequest<T>(url, options);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on authentication or not found errors
      if (error instanceof AuthenticationError || error instanceof NotFoundError) {
        throw error;
      }
      
      // Retry on rate limit or server errors
      if (error instanceof RateLimitError && attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }
      
      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }
  
  throw lastError!;
}
