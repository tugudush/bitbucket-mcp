// Suggested improvement: Define constants for magic numbers

// API Configuration Constants
export const API_CONSTANTS = {
  // Pagination limits
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 10,
  
  // File content limits  
  MAX_FILE_LINES: 10000,
  DEFAULT_FILE_LINES: 1000,
  
  // Repository browsing limits
  MAX_BROWSE_ITEMS: 100,
  DEFAULT_BROWSE_ITEMS: 50,
  
  // API configuration
  REQUEST_TIMEOUT_MS: 30000,
  RETRY_ATTEMPTS: 3,
  CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes
  
  // Rate limiting
  BACKOFF_BASE_MS: 1000,
  BACKOFF_MAX_MS: 10000,
} as const;

// Usage in schemas:
const GetRepositorySchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  pagelen: z.number()
    .optional()
    .describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
});

// Usage in implementations:
if (parsed.pagelen) {
  params.append('pagelen', Math.min(parsed.pagelen, API_CONSTANTS.MAX_PAGE_SIZE).toString());
}
