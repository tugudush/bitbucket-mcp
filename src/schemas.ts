import { z } from 'zod';

/**
 * API Constants for Bitbucket operations
 */
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
  RETRY_ATTEMPTS: 3,
} as const;

/**
 * Zod schemas for input validation of Bitbucket tools
 */
export const GetRepositorySchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
});

export const ListRepositoriesSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z
    .number()
    .optional()
    .describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
});

export const GetPullRequestsSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  state: z
    .enum(['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED'])
    .optional()
    .describe('Filter by pull request state'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z
    .number()
    .optional()
    .describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
});

export const GetPullRequestSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  pull_request_id: z.number().describe('The pull request ID'),
});

export const GetPullRequestCommentsSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  pull_request_id: z.number().describe('The pull request ID'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z
    .number()
    .optional()
    .describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
});

export const GetPullRequestCommentSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  pull_request_id: z.number().describe('The pull request ID'),
  comment_id: z.number().describe('The comment ID'),
});

export const GetCommentThreadSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  pull_request_id: z.number().describe('The pull request ID'),
  comment_id: z
    .number()
    .describe(
      'The root comment ID to get thread for (will include all replies)'
    ),
});

export const GetPullRequestActivitySchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  pull_request_id: z.number().describe('The pull request ID'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z
    .number()
    .optional()
    .describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
});

export const GetIssuesSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  state: z
    .enum([
      'new',
      'open',
      'resolved',
      'on hold',
      'invalid',
      'duplicate',
      'wontfix',
      'closed',
    ])
    .optional()
    .describe('Filter by issue state'),
  kind: z
    .enum(['bug', 'enhancement', 'proposal', 'task'])
    .optional()
    .describe('Filter by issue kind'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z
    .number()
    .optional()
    .describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
});

export const GetIssueSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  issue_id: z.number().describe('The issue ID'),
});

export const GetCommitsSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  branch: z
    .string()
    .optional()
    .describe('Branch name (defaults to main branch)'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z
    .number()
    .optional()
    .describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
});

export const GetBranchesSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z
    .number()
    .optional()
    .describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
});

export const GetFileContentSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  file_path: z.string().describe('Path to the file in the repository'),
  ref: z
    .string()
    .optional()
    .describe('Branch, tag, or commit hash (defaults to main branch)'),
  start: z
    .number()
    .optional()
    .describe('Starting line number for pagination (1-based, default: 1)'),
  limit: z
    .number()
    .optional()
    .describe(
      `Maximum number of lines to return (default: ${API_CONSTANTS.DEFAULT_FILE_LINES}, max: ${API_CONSTANTS.MAX_FILE_LINES})`
    ),
});

export const BrowseRepositorySchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  path: z
    .string()
    .optional()
    .describe('Directory path within the repository (default: repo root)'),
  ref: z
    .string()
    .optional()
    .describe('Branch, tag, or commit hash (defaults to main branch)'),
  limit: z
    .number()
    .optional()
    .describe(
      `Maximum number of items to return (default: ${API_CONSTANTS.DEFAULT_BROWSE_ITEMS}, max: ${API_CONSTANTS.MAX_BROWSE_ITEMS})`
    ),
});

export const ListWorkspacesSchema = z.object({
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z
    .number()
    .optional()
    .describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
});

export const GetUserSchema = z.object({
  username: z
    .string()
    .optional()
    .describe(
      'The username to get information about. Note: Bitbucket API v2.0 only supports current user. Use bb_get_current_user instead.'
    ),
});

export const GetWorkspaceSchema = z.object({
  workspace: z.string().describe('The workspace name'),
});

export const GetCurrentUserSchema = z.object({
  // No parameters needed for current user
});

export const SearchRepositoriesSchema = z.object({
  workspace: z.string().describe('The workspace or username to search in'),
  query: z
    .string()
    .describe('Search query to filter repositories by name or description'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z
    .number()
    .optional()
    .describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
});

export const GetPullRequestDiffSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  pull_request_id: z.number().describe('The pull request ID'),
  context: z
    .number()
    .optional()
    .describe('Number of context lines around changes (like git diff -U)'),
  path: z.string().optional().describe('Filter diff to a single file path'),
});

export const GetPullRequestDiffstatSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  pull_request_id: z.number().describe('The pull request ID'),
  path: z.string().optional().describe('Filter diffstat to a single file path'),
});

export const GetDiffSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  spec: z
    .string()
    .describe(
      'Commit spec: a single commit hash (diffs against parent), or two commits as "commit1..commit2"'
    ),
  context: z
    .number()
    .optional()
    .describe('Number of context lines around changes'),
  path: z.string().optional().describe('Filter diff to a single file path'),
  ignore_whitespace: z
    .boolean()
    .optional()
    .describe('Ignore whitespace changes'),
  topic: z
    .boolean()
    .optional()
    .describe(
      'When true with two-commit spec, produces a 3-dot diff (source vs merge-base)'
    ),
});

export const GetDiffstatSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  spec: z
    .string()
    .describe(
      'Commit spec: a single commit hash (diffs against parent), or two commits as "commit1..commit2"'
    ),
  path: z.string().optional().describe('Filter diffstat to a single file path'),
  ignore_whitespace: z
    .boolean()
    .optional()
    .describe('Ignore whitespace changes'),
  topic: z
    .boolean()
    .optional()
    .describe(
      'When true with two-commit spec, produces a 3-dot diff (source vs merge-base)'
    ),
});

// --- PR additional schemas ---

export const GetPullRequestCommitsSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  pull_request_id: z.number().describe('The pull request ID'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z
    .number()
    .optional()
    .describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
});

export const GetPullRequestStatusesSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  pull_request_id: z.number().describe('The pull request ID'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z
    .number()
    .optional()
    .describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
});

// --- Commit schemas ---

export const GetCommitSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  commit: z.string().describe('The commit hash, branch name, or tag'),
});

export const GetCommitStatusesSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  commit: z.string().describe('The commit hash'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z
    .number()
    .optional()
    .describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
});

export const GetMergeBaseSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  revspec: z
    .string()
    .describe(
      'Two commit hashes or branch names separated by ".." (e.g. "main..feature-branch")'
    ),
});

export const GetFileHistorySchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  commit: z
    .string()
    .describe('Commit hash, branch, or tag to start history from'),
  path: z.string().describe('Path to the file in the repository'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z
    .number()
    .optional()
    .describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
});

// --- Ref schemas ---

export const GetTagsSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z
    .number()
    .optional()
    .describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
});

export const GetTagSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  name: z.string().describe('The tag name'),
});

export const GetBranchSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  name: z.string().describe('The branch name'),
});

// --- Pipeline schemas ---

export const ListPipelinesSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z
    .number()
    .optional()
    .describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
});

export const GetPipelineSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  pipeline_uuid: z
    .string()
    .describe('The pipeline UUID (with or without curly braces)'),
});

export const GetPipelineStepsSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  pipeline_uuid: z
    .string()
    .describe('The pipeline UUID (with or without curly braces)'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z
    .number()
    .optional()
    .describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
});

export const GetPipelineStepLogSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  pipeline_uuid: z
    .string()
    .describe('The pipeline UUID (with or without curly braces)'),
  step_uuid: z
    .string()
    .describe('The step UUID (with or without curly braces)'),
});

export const ListUserPullRequestsSchema = z.object({
  selected_user: z
    .string()
    .describe(
      "The username or UUID of the user to list PRs for. Use the authenticated user's username to see your own PRs."
    ),
  state: z
    .enum(['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED'])
    .optional()
    .describe('Filter by pull request state'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z
    .number()
    .optional()
    .describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
});

export const SearchCodeSchema = z.object({
  workspace: z.string().describe('The workspace to search in'),
  search_query: z.string().describe('Search query for code content'),
  repo_slug: z
    .string()
    .optional()
    .describe('Repository slug to limit search to specific repository'),
  language: z
    .string()
    .optional()
    .describe('Filter code search by programming language'),
  extension: z
    .string()
    .optional()
    .describe('Filter code search by file extension'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z
    .number()
    .optional()
    .describe(`Number of items per page (max ${API_CONSTANTS.MAX_PAGE_SIZE})`),
});
