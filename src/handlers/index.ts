/**
 * Handlers module - exports all tool handlers and registry
 */

// Re-export types
export * from './types.js';

// Repository handlers
export {
  handleGetRepository,
  handleListRepositories,
  handleGetBranches,
  handleGetCommits,
  handleBrowseRepository,
  handleGetFileContent,
} from './repository.js';

// Pull request handlers
export {
  handleGetPullRequests,
  handleGetPullRequest,
  handleGetPullRequestComments,
  handleGetPullRequestComment,
  handleGetCommentThread,
  handleGetPullRequestActivity,
} from './pullrequest.js';

// Issue handlers
export { handleGetIssues, handleGetIssue } from './issue.js';

// Workspace/user handlers
export {
  handleListWorkspaces,
  handleGetWorkspace,
  handleGetUser,
  handleGetCurrentUser,
} from './workspace.js';

// Search handlers
export { handleSearchRepositories, handleSearchCode } from './search.js';

// Import for registry
import type { ToolHandler } from './types.js';
import {
  handleGetRepository,
  handleListRepositories,
  handleGetBranches,
  handleGetCommits,
  handleBrowseRepository,
  handleGetFileContent,
} from './repository.js';
import {
  handleGetPullRequests,
  handleGetPullRequest,
  handleGetPullRequestComments,
  handleGetPullRequestComment,
  handleGetCommentThread,
  handleGetPullRequestActivity,
} from './pullrequest.js';
import { handleGetIssues, handleGetIssue } from './issue.js';
import {
  handleListWorkspaces,
  handleGetWorkspace,
  handleGetUser,
  handleGetCurrentUser,
} from './workspace.js';
import { handleSearchRepositories, handleSearchCode } from './search.js';

/**
 * Registry mapping tool names to their handler functions
 * This eliminates the need for a large switch statement
 */
export const toolHandlers: Record<string, ToolHandler> = {
  // Repository tools
  bb_get_repository: handleGetRepository,
  bb_list_repositories: handleListRepositories,
  bb_get_branches: handleGetBranches,
  bb_get_commits: handleGetCommits,
  bb_browse_repository: handleBrowseRepository,
  bb_get_file_content: handleGetFileContent,

  // Pull request tools
  bb_get_pull_requests: handleGetPullRequests,
  bb_get_pull_request: handleGetPullRequest,
  bb_get_pull_request_comments: handleGetPullRequestComments,
  bb_get_pull_request_comment: handleGetPullRequestComment,
  bb_get_comment_thread: handleGetCommentThread,
  bb_get_pull_request_activity: handleGetPullRequestActivity,

  // Issue tools
  bb_get_issues: handleGetIssues,
  bb_get_issue: handleGetIssue,

  // Workspace/user tools
  bb_list_workspaces: handleListWorkspaces,
  bb_get_workspace: handleGetWorkspace,
  bb_get_user: handleGetUser,
  bb_get_current_user: handleGetCurrentUser,

  // Search tools
  bb_search_repositories: handleSearchRepositories,
  bb_search_code: handleSearchCode,
};
