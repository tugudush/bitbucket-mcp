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
  GetPullRequestActivitySchema,
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
      name: 'bb_get_pull_request_activity',
      description:
        'Get activity (reviews, approvals, comments) for a specific pull request',
      inputSchema: zodToJsonSchema(
        GetPullRequestActivitySchema
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
        'Get information about a Bitbucket user. If no username is provided, returns information about the authenticated user.',
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
        'Search for repositories within a workspace by name or description.',
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
