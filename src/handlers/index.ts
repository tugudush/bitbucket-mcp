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
  handleGetTags,
  handleGetTag,
  handleGetBranch,
} from './repository.js';

// Pull request handlers
export {
  handleGetPullRequests,
  handleGetPullRequest,
  handleGetPullRequestComments,
  handleGetPullRequestComment,
  handleGetCommentThread,
  handleGetPullRequestActivity,
  handleGetPullRequestCommits,
  handleGetPullRequestStatuses,
} from './pullrequest.js';

// Diff handlers
export {
  handleGetPullRequestDiff,
  handleGetPullRequestDiffstat,
  handleGetDiff,
  handleGetDiffstat,
} from './diff.js';

// Commit handlers
export {
  handleGetCommit,
  handleGetCommitStatuses,
  handleGetMergeBase,
  handleGetFileHistory,
} from './commit.js';

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

// Pipeline handlers
export {
  handleListPipelines,
  handleGetPipeline,
  handleGetPipelineSteps,
  handleGetPipelineStepLog,
} from './pipeline.js';

// Import for registry
import type { ToolHandler } from './types.js';
import {
  handleGetRepository,
  handleListRepositories,
  handleGetBranches,
  handleGetCommits,
  handleBrowseRepository,
  handleGetFileContent,
  handleGetTags,
  handleGetTag,
  handleGetBranch,
} from './repository.js';
import {
  handleGetPullRequests,
  handleGetPullRequest,
  handleGetPullRequestComments,
  handleGetPullRequestComment,
  handleGetCommentThread,
  handleGetPullRequestActivity,
  handleGetPullRequestCommits,
  handleGetPullRequestStatuses,
} from './pullrequest.js';
import {
  handleGetPullRequestDiff,
  handleGetPullRequestDiffstat,
  handleGetDiff,
  handleGetDiffstat,
} from './diff.js';
import {
  handleGetCommit,
  handleGetCommitStatuses,
  handleGetMergeBase,
  handleGetFileHistory,
} from './commit.js';
import { handleGetIssues, handleGetIssue } from './issue.js';
import {
  handleListWorkspaces,
  handleGetWorkspace,
  handleGetUser,
  handleGetCurrentUser,
} from './workspace.js';
import { handleSearchRepositories, handleSearchCode } from './search.js';
import {
  handleListPipelines,
  handleGetPipeline,
  handleGetPipelineSteps,
  handleGetPipelineStepLog,
} from './pipeline.js';

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
  bb_get_tags: handleGetTags,
  bb_get_tag: handleGetTag,
  bb_get_branch: handleGetBranch,

  // Pull request tools
  bb_get_pull_requests: handleGetPullRequests,
  bb_get_pull_request: handleGetPullRequest,
  bb_get_pull_request_comments: handleGetPullRequestComments,
  bb_get_pull_request_comment: handleGetPullRequestComment,
  bb_get_comment_thread: handleGetCommentThread,
  bb_get_pull_request_activity: handleGetPullRequestActivity,
  bb_get_pr_commits: handleGetPullRequestCommits,
  bb_get_pr_statuses: handleGetPullRequestStatuses,

  // Diff tools
  bb_get_pull_request_diff: handleGetPullRequestDiff,
  bb_get_pull_request_diffstat: handleGetPullRequestDiffstat,
  bb_get_diff: handleGetDiff,
  bb_get_diffstat: handleGetDiffstat,

  // Commit tools
  bb_get_commit: handleGetCommit,
  bb_get_commit_statuses: handleGetCommitStatuses,
  bb_get_merge_base: handleGetMergeBase,
  bb_get_file_history: handleGetFileHistory,

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

  // Pipeline tools
  bb_list_pipelines: handleListPipelines,
  bb_get_pipeline: handleGetPipeline,
  bb_get_pipeline_steps: handleGetPipelineSteps,
  bb_get_pipeline_step_log: handleGetPipelineStepLog,
};
