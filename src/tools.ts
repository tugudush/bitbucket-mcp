/**
 * Tool definitions and handler routing for the Bitbucket MCP server
 *
 * This module provides:
 * - Tool definitions (schema + metadata) for MCP
 * - Handler routing using a registry pattern
 */

import { zodToJsonSchema } from 'zod-to-json-schema';
import { CallToolRequest, Tool } from '@modelcontextprotocol/sdk/types.js';
import {
  GetRepositorySchema,
  ListRepositoriesSchema,
  ListWorkspacesSchema,
  GetPullRequestsSchema,
  GetPullRequestSchema,
  GetPullRequestCommentsSchema,
  GetPullRequestCommentSchema,
  GetCommentThreadSchema,
  GetPullRequestActivitySchema,
  GetPullRequestDiffSchema,
  GetPullRequestDiffstatSchema,
  GetPullRequestCommitsSchema,
  GetPullRequestStatusesSchema,
  GetDiffSchema,
  GetDiffstatSchema,
  GetCommitSchema,
  GetCommitStatusesSchema,
  GetMergeBaseSchema,
  GetFileHistorySchema,
  GetTagsSchema,
  GetTagSchema,
  GetBranchSchema,
  ListPipelinesSchema,
  GetPipelineSchema,
  GetPipelineStepsSchema,
  GetPipelineStepLogSchema,
  GetIssuesSchema,
  GetIssueSchema,
  GetCommitsSchema,
  GetBranchesSchema,
  GetFileContentSchema,
  BrowseRepositorySchema,
  GetUserSchema,
  GetCurrentUserSchema,
  SearchRepositoriesSchema,
  SearchCodeSchema,
  GetWorkspaceSchema,
} from './schemas.js';
import { toolHandlers } from './handlers/index.js';

/**
 * Tool definitions for the Bitbucket MCP server
 * Each tool has a name, description, and input schema
 */
export function getToolDefinitions(): Tool[] {
  return [
    {
      name: 'bb_get_repository',
      description: 'Get detailed information about a specific repository',
      inputSchema: zodToJsonSchema(GetRepositorySchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_list_repositories',
      description: 'List repositories in a workspace',
      inputSchema: zodToJsonSchema(
        ListRepositoriesSchema
      ) as Tool['inputSchema'],
    },
    {
      name: 'bb_list_workspaces',
      description:
        'List all accessible workspaces for discovery and exploration',
      inputSchema: zodToJsonSchema(ListWorkspacesSchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_pull_requests',
      description: 'Get pull requests for a repository',
      inputSchema: zodToJsonSchema(
        GetPullRequestsSchema
      ) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_pull_request',
      description: 'Get detailed information about a specific pull request',
      inputSchema: zodToJsonSchema(GetPullRequestSchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_pull_request_comments',
      description: 'Get comments for a specific pull request',
      inputSchema: zodToJsonSchema(
        GetPullRequestCommentsSchema
      ) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_pull_request_comment',
      description: 'Get a single comment by ID from a pull request',
      inputSchema: zodToJsonSchema(
        GetPullRequestCommentSchema
      ) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_comment_thread',
      description:
        'Get a comment thread including the root comment and all nested replies',
      inputSchema: zodToJsonSchema(
        GetCommentThreadSchema
      ) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_pull_request_activity',
      description:
        'Get activity (reviews, approvals, comments) for a specific pull request',
      inputSchema: zodToJsonSchema(
        GetPullRequestActivitySchema
      ) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_pull_request_diff',
      description:
        'Get the raw unified diff for a pull request. Returns text/plain diff output showing all changes.',
      inputSchema: zodToJsonSchema(
        GetPullRequestDiffSchema
      ) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_pull_request_diffstat',
      description:
        'Get the diffstat for a pull request — per-file summary of lines added/removed and change status.',
      inputSchema: zodToJsonSchema(
        GetPullRequestDiffstatSchema
      ) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_diff',
      description:
        'Get the raw unified diff between commits. Use a single commit hash to diff against its parent, or "commit1..commit2" for comparing two commits.',
      inputSchema: zodToJsonSchema(GetDiffSchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_diffstat',
      description:
        'Get diffstat (per-file change summary) between commits. Use a single commit hash or "commit1..commit2".',
      inputSchema: zodToJsonSchema(GetDiffstatSchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_pr_commits',
      description: 'List commits that belong to a pull request',
      inputSchema: zodToJsonSchema(
        GetPullRequestCommitsSchema
      ) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_pr_statuses',
      description:
        'Get CI/CD build statuses for a pull request (checks whether builds pass or fail)',
      inputSchema: zodToJsonSchema(
        GetPullRequestStatusesSchema
      ) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_commit',
      description:
        'Get detailed information about a specific commit (hash, message, author, parents)',
      inputSchema: zodToJsonSchema(GetCommitSchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_commit_statuses',
      description: 'Get CI/CD build statuses for a specific commit',
      inputSchema: zodToJsonSchema(
        GetCommitStatusesSchema
      ) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_merge_base',
      description:
        'Get the common ancestor (merge-base) between two commits or branches. Use "branch1..branch2" format.',
      inputSchema: zodToJsonSchema(GetMergeBaseSchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_file_history',
      description:
        'Get the commit history for a specific file — shows which commits modified the file and when.',
      inputSchema: zodToJsonSchema(GetFileHistorySchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_tags',
      description: 'List tags (release tags, version tags) for a repository',
      inputSchema: zodToJsonSchema(GetTagsSchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_tag',
      description:
        'Get detailed information about a specific tag including its target commit',
      inputSchema: zodToJsonSchema(GetTagSchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_branch',
      description:
        'Get detailed information about a specific branch including target commit and merge strategies',
      inputSchema: zodToJsonSchema(GetBranchSchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_list_pipelines',
      description:
        'List CI/CD pipeline runs for a repository. Shows build status, trigger, and duration.',
      inputSchema: zodToJsonSchema(ListPipelinesSchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_pipeline',
      description: 'Get detailed information about a specific pipeline run',
      inputSchema: zodToJsonSchema(GetPipelineSchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_pipeline_steps',
      description:
        'List the steps/stages of a pipeline run with their status and duration',
      inputSchema: zodToJsonSchema(
        GetPipelineStepsSchema
      ) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_pipeline_step_log',
      description:
        'Get the build log output for a specific pipeline step. Useful for diagnosing build failures.',
      inputSchema: zodToJsonSchema(
        GetPipelineStepLogSchema
      ) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_issues',
      description: 'Get issues for a repository',
      inputSchema: zodToJsonSchema(GetIssuesSchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_issue',
      description: 'Get detailed information about a specific issue',
      inputSchema: zodToJsonSchema(GetIssueSchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_commits',
      description: 'Get commits for a repository branch',
      inputSchema: zodToJsonSchema(GetCommitsSchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_branches',
      description: 'Get branches for a repository',
      inputSchema: zodToJsonSchema(GetBranchesSchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_file_content',
      description:
        'Get the content of a file from a repository with pagination support',
      inputSchema: zodToJsonSchema(GetFileContentSchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_browse_repository',
      description:
        'Browse files and directories in a repository to explore structure',
      inputSchema: zodToJsonSchema(
        BrowseRepositorySchema
      ) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_user',
      description:
        'Get public information about a Bitbucket user by username or UUID. If no user is specified, returns the authenticated user. Note: private profiles may have limited fields.',
      inputSchema: zodToJsonSchema(GetUserSchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_current_user',
      description: 'Get information about the currently authenticated user.',
      inputSchema: zodToJsonSchema(GetCurrentUserSchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_search_repositories',
      description:
        'Search for repositories within a workspace by name or description. Uses Bitbucket server-side filtering to search across all repositories, not just the first page. Supports sorting with the sort parameter.',
      inputSchema: zodToJsonSchema(
        SearchRepositoriesSchema
      ) as Tool['inputSchema'],
    },
    {
      name: 'bb_search_code',
      description:
        'Search for code content within a workspace. Supports filtering by repository, language, and file extension.',
      inputSchema: zodToJsonSchema(SearchCodeSchema) as Tool['inputSchema'],
    },
    {
      name: 'bb_get_workspace',
      description: 'Get information about a workspace',
      inputSchema: zodToJsonSchema(GetWorkspaceSchema) as Tool['inputSchema'],
    },
  ];
}

/**
 * Handle tool calls using the handler registry
 * This replaces the large switch statement with a clean lookup pattern
 */
export async function handleToolCall(request: CallToolRequest): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
  [key: string]: unknown;
}> {
  const { name, arguments: args } = request.params;

  // Look up handler in registry
  const handler = toolHandlers[name];

  if (!handler) {
    return {
      content: [{ type: 'text', text: `Error: Unknown tool: ${name}` }],
      isError: true,
    };
  }

  try {
    const result = await handler(args);
    return {
      ...result,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
