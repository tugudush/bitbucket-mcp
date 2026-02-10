/**
 * Tool definitions and handler routing for the Bitbucket MCP server
 *
 * This module provides:
 * - Tool definitions (schema + metadata) for MCP
 * - Handler routing using a registry pattern
 * - Output format conversion (text / JSON / TOON) with JMESPath filtering
 */

import { zodToJsonSchema } from 'zod-to-json-schema';
import { CallToolRequest, Tool } from '@modelcontextprotocol/sdk/types.js';
import { encode as toonEncode } from '@toon-format/toon';
import { search as jmespathSearch } from 'jmespath';
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
  OutputOptionsSchema,
} from './schemas.js';
import { toolHandlers } from './handlers/index.js';

/**
 * Convert a Zod schema to JSON Schema and inject output_format / filter properties
 */
function toolSchema(
  zodSchema: Parameters<typeof zodToJsonSchema>[0]
): Tool['inputSchema'] {
  const outputOptsJsonSchema = zodToJsonSchema(OutputOptionsSchema) as {
    properties?: Record<string, unknown>;
  };
  const baseSchema = zodToJsonSchema(zodSchema) as {
    properties?: Record<string, unknown>;
    required?: string[];
  };

  // Merge output options into the tool's JSON Schema properties
  return {
    ...baseSchema,
    properties: {
      ...baseSchema.properties,
      ...outputOptsJsonSchema.properties,
    },
  } as Tool['inputSchema'];
}

/**
 * Tool definitions for the Bitbucket MCP server
 * Each tool has a name, description, and input schema
 */
export function getToolDefinitions(): Tool[] {
  return [
    {
      name: 'bb_get_repository',
      description: 'Get detailed information about a specific repository',
      inputSchema: toolSchema(GetRepositorySchema),
    },
    {
      name: 'bb_list_repositories',
      description: 'List repositories in a workspace',
      inputSchema: toolSchema(ListRepositoriesSchema),
    },
    {
      name: 'bb_list_workspaces',
      description:
        'List all accessible workspaces for discovery and exploration',
      inputSchema: toolSchema(ListWorkspacesSchema),
    },
    {
      name: 'bb_get_pull_requests',
      description: 'Get pull requests for a repository',
      inputSchema: toolSchema(GetPullRequestsSchema),
    },
    {
      name: 'bb_get_pull_request',
      description: 'Get detailed information about a specific pull request',
      inputSchema: toolSchema(GetPullRequestSchema),
    },
    {
      name: 'bb_get_pull_request_comments',
      description: 'Get comments for a specific pull request',
      inputSchema: toolSchema(GetPullRequestCommentsSchema),
    },
    {
      name: 'bb_get_pull_request_comment',
      description: 'Get a single comment by ID from a pull request',
      inputSchema: toolSchema(GetPullRequestCommentSchema),
    },
    {
      name: 'bb_get_comment_thread',
      description:
        'Get a comment thread including the root comment and all nested replies',
      inputSchema: toolSchema(GetCommentThreadSchema),
    },
    {
      name: 'bb_get_pull_request_activity',
      description:
        'Get activity (reviews, approvals, comments) for a specific pull request',
      inputSchema: toolSchema(GetPullRequestActivitySchema),
    },
    {
      name: 'bb_get_pull_request_diff',
      description:
        'Get the raw unified diff for a pull request. Returns text/plain diff output showing all changes.',
      inputSchema: toolSchema(GetPullRequestDiffSchema),
    },
    {
      name: 'bb_get_pull_request_diffstat',
      description:
        'Get the diffstat for a pull request — per-file summary of lines added/removed and change status.',
      inputSchema: toolSchema(GetPullRequestDiffstatSchema),
    },
    {
      name: 'bb_get_diff',
      description:
        'Get the raw unified diff between commits. Use a single commit hash to diff against its parent, or "commit1..commit2" for comparing two commits.',
      inputSchema: toolSchema(GetDiffSchema),
    },
    {
      name: 'bb_get_diffstat',
      description:
        'Get diffstat (per-file change summary) between commits. Use a single commit hash or "commit1..commit2".',
      inputSchema: toolSchema(GetDiffstatSchema),
    },
    {
      name: 'bb_get_pr_commits',
      description: 'List commits that belong to a pull request',
      inputSchema: toolSchema(GetPullRequestCommitsSchema),
    },
    {
      name: 'bb_get_pr_statuses',
      description:
        'Get CI/CD build statuses for a pull request (checks whether builds pass or fail)',
      inputSchema: toolSchema(GetPullRequestStatusesSchema),
    },
    {
      name: 'bb_get_commit',
      description:
        'Get detailed information about a specific commit (hash, message, author, parents)',
      inputSchema: toolSchema(GetCommitSchema),
    },
    {
      name: 'bb_get_commit_statuses',
      description: 'Get CI/CD build statuses for a specific commit',
      inputSchema: toolSchema(GetCommitStatusesSchema),
    },
    {
      name: 'bb_get_merge_base',
      description:
        'Get the common ancestor (merge-base) between two commits or branches. Use "branch1..branch2" format.',
      inputSchema: toolSchema(GetMergeBaseSchema),
    },
    {
      name: 'bb_get_file_history',
      description:
        'Get the commit history for a specific file — shows which commits modified the file and when.',
      inputSchema: toolSchema(GetFileHistorySchema),
    },
    {
      name: 'bb_get_tags',
      description: 'List tags (release tags, version tags) for a repository',
      inputSchema: toolSchema(GetTagsSchema),
    },
    {
      name: 'bb_get_tag',
      description:
        'Get detailed information about a specific tag including its target commit',
      inputSchema: toolSchema(GetTagSchema),
    },
    {
      name: 'bb_get_branch',
      description:
        'Get detailed information about a specific branch including target commit and merge strategies',
      inputSchema: toolSchema(GetBranchSchema),
    },
    {
      name: 'bb_list_pipelines',
      description:
        'List CI/CD pipeline runs for a repository. Shows build status, trigger, and duration.',
      inputSchema: toolSchema(ListPipelinesSchema),
    },
    {
      name: 'bb_get_pipeline',
      description: 'Get detailed information about a specific pipeline run',
      inputSchema: toolSchema(GetPipelineSchema),
    },
    {
      name: 'bb_get_pipeline_steps',
      description:
        'List the steps/stages of a pipeline run with their status and duration',
      inputSchema: toolSchema(GetPipelineStepsSchema),
    },
    {
      name: 'bb_get_pipeline_step_log',
      description:
        'Get the build log output for a specific pipeline step. Useful for diagnosing build failures.',
      inputSchema: toolSchema(GetPipelineStepLogSchema),
    },
    {
      name: 'bb_get_issues',
      description: 'Get issues for a repository',
      inputSchema: toolSchema(GetIssuesSchema),
    },
    {
      name: 'bb_get_issue',
      description: 'Get detailed information about a specific issue',
      inputSchema: toolSchema(GetIssueSchema),
    },
    {
      name: 'bb_get_commits',
      description: 'Get commits for a repository branch',
      inputSchema: toolSchema(GetCommitsSchema),
    },
    {
      name: 'bb_get_branches',
      description: 'Get branches for a repository',
      inputSchema: toolSchema(GetBranchesSchema),
    },
    {
      name: 'bb_get_file_content',
      description:
        'Get the content of a file from a repository with pagination support',
      inputSchema: toolSchema(GetFileContentSchema),
    },
    {
      name: 'bb_browse_repository',
      description:
        'Browse files and directories in a repository to explore structure',
      inputSchema: toolSchema(BrowseRepositorySchema),
    },
    {
      name: 'bb_get_user',
      description:
        'Get public information about a Bitbucket user by username or UUID. If no user is specified, returns the authenticated user. Note: private profiles may have limited fields.',
      inputSchema: toolSchema(GetUserSchema),
    },
    {
      name: 'bb_get_current_user',
      description: 'Get information about the currently authenticated user.',
      inputSchema: toolSchema(GetCurrentUserSchema),
    },
    {
      name: 'bb_search_repositories',
      description:
        'Search for repositories within a workspace by name or description. Uses Bitbucket server-side filtering to search across all repositories, not just the first page. Supports sorting with the sort parameter.',
      inputSchema: toolSchema(SearchRepositoriesSchema),
    },
    {
      name: 'bb_search_code',
      description:
        'Search for code content within a workspace. Supports filtering by repository, language, and file extension.',
      inputSchema: toolSchema(SearchCodeSchema),
    },
    {
      name: 'bb_get_workspace',
      description: 'Get information about a workspace',
      inputSchema: toolSchema(GetWorkspaceSchema),
    },
  ];
}

/**
 * Supported output formats
 */
type OutputFormat = 'text' | 'json' | 'toon';

/**
 * Extract output_format and filter from tool arguments, returning
 * the cleaned args (without output options) and the output options.
 */
function extractOutputOptions(args: unknown): {
  cleanArgs: unknown;
  outputFormat: OutputFormat;
  filter?: string;
} {
  if (args && typeof args === 'object' && !Array.isArray(args)) {
    const { output_format, filter, ...rest } = args as Record<string, unknown>;
    return {
      cleanArgs: rest,
      outputFormat: (output_format as OutputFormat) || 'text',
      filter: filter as string | undefined,
    };
  }
  return { cleanArgs: args, outputFormat: 'text' };
}

/**
 * Format structured data according to the requested output format.
 * Applies JMESPath filtering first, then converts to the target format.
 */
function formatOutput(
  data: unknown,
  format: OutputFormat,
  filter?: string
): string {
  let processed = data;

  // Apply JMESPath filter if provided
  if (filter && processed != null) {
    try {
      processed = jmespathSearch(processed, filter);
    } catch (err) {
      return `Error: Invalid JMESPath expression "${filter}": ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // Convert to requested format
  switch (format) {
    case 'json':
      return JSON.stringify(processed, null, 2);
    case 'toon':
      try {
        return toonEncode(processed);
      } catch {
        // Fall back to JSON if TOON encoding fails (e.g. unsupported types)
        return JSON.stringify(processed, null, 2);
      }
    default:
      // 'text' — should not reach here, handled before calling formatOutput
      return typeof processed === 'string'
        ? processed
        : JSON.stringify(processed, null, 2);
  }
}

/**
 * Strip the internal `_data` field from a ToolResponse before returning to the client.
 */
function stripData(result: {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
  _data?: unknown;
}): { content: Array<{ type: 'text'; text: string }>; isError?: boolean } {
  const out: {
    content: Array<{ type: 'text'; text: string }>;
    isError?: boolean;
  } = {
    content: result.content,
  };
  if (result.isError !== undefined) {
    out.isError = result.isError;
  }
  return out;
}

/**
 * Handle tool calls using the handler registry.
 * Supports output format conversion (text / JSON / TOON) and JMESPath filtering.
 */
export async function handleToolCall(request: CallToolRequest): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
  [key: string]: unknown;
}> {
  const { name, arguments: args } = request.params;

  // Extract output options before passing to handler
  const { cleanArgs, outputFormat, filter } = extractOutputOptions(args);

  // Look up handler in registry
  const handler = toolHandlers[name];

  if (!handler) {
    return {
      content: [{ type: 'text', text: `Error: Unknown tool: ${name}` }],
      isError: true,
    };
  }

  try {
    const result = await handler(cleanArgs);

    // If error response, return as-is
    if (result.isError) {
      return { ...result };
    }

    // If text format requested or no structured data available, return text output
    // (applying JMESPath + format only when structured data exists)
    if (outputFormat === 'text' && !filter) {
      // Default path: return text as-is, strip _data
      return stripData(result);
    }

    // Structured output requested — need _data
    if (result._data != null) {
      const formatted = formatOutput(result._data, outputFormat, filter);
      return {
        content: [{ type: 'text', text: formatted }],
      };
    }

    // No structured data but filter/format requested — warn and return text
    if (filter || outputFormat !== 'text') {
      // If a filter was specified but no structured data is available,
      // return the original text with a warning
      const warning =
        `[Note: output_format="${outputFormat}" or filter requested, ` +
        `but no structured data is available for this tool response. ` +
        `Returning default text output.]\n\n`;
      return {
        content: [{ type: 'text', text: warning + result.content[0].text }],
      };
    }

    return stripData(result);
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
