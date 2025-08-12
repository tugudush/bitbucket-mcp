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
  API_CONSTANTS,
} from './schemas.js';
import { makeRequest, buildApiUrl, addQueryParams } from './api.js';
import type {
  BitbucketApiResponse,
  BitbucketRepository,
  BitbucketWorkspace,
  BitbucketPullRequest,
  BitbucketComment,
  BitbucketActivity,
  BitbucketIssue,
  BitbucketCommit,
  BitbucketBranchWithTarget,
  BitbucketSrcListingResponse,
  BitbucketUser,
  CodeSearchResponse,
} from './types.js';

/**
 * Tool definitions for the Bitbucket MCP server
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

export async function handleToolCall(request: CallToolRequest): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}> {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'bb_get_repository': {
        const parsed = GetRepositorySchema.parse(args);
        const url = buildApiUrl(
          `/repositories/${parsed.workspace}/${parsed.repo_slug}`
        );
        const data = await makeRequest<BitbucketRepository>(url);

        return {
          content: [
            {
              type: 'text',
              text:
                `Repository: ${data.full_name}\n` +
                `Description: ${data.description || 'No description'}\n` +
                `Language: ${data.language || 'Not specified'}\n` +
                `Private: ${data.is_private}\n` +
                `Created: ${data.created_on}\n` +
                `Updated: ${data.updated_on}\n` +
                `Size: ${data.size ? `${data.size} bytes` : 'Unknown'}\n` +
                `Forks: ${data.forks_count || 0}\n` +
                `Watchers: ${data.watchers_count || 0}\n` +
                `Website: ${data.website || 'None'}`,
            },
          ],
        };
      }

      case 'bb_list_repositories': {
        const parsed = ListRepositoriesSchema.parse(args);
        const params = {
          page: parsed.page,
          pagelen: parsed.pagelen,
        };
        const url = addQueryParams(
          buildApiUrl(`/repositories/${parsed.workspace}`),
          params
        );
        const data =
          await makeRequest<BitbucketApiResponse<BitbucketRepository>>(url);

        const repoList = data.values
          .map(
            (repo: BitbucketRepository) =>
              `- ${repo.full_name} (${repo.language || 'Unknown'})\n` +
              `  ${repo.description || 'No description'}\n` +
              `  Private: ${repo.is_private}, Updated: ${repo.updated_on}`
          )
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Repositories in ${parsed.workspace} (${data.size} total):\n\n${repoList}`,
            },
          ],
        };
      }

      case 'bb_list_workspaces': {
        const parsed = ListWorkspacesSchema.parse(args);
        const params = {
          page: parsed.page,
          pagelen: parsed.pagelen,
        };
        const url = addQueryParams(buildApiUrl('/workspaces'), params);
        const data =
          await makeRequest<BitbucketApiResponse<BitbucketWorkspace>>(url);

        const workspaceList = data.values
          .map(
            (workspace: BitbucketWorkspace) =>
              `- ${workspace.slug} (${workspace.name})\n` +
              `  Type: ${workspace.type}\n` +
              `  Created: ${workspace.created_on || 'Unknown'}`
          )
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Accessible workspaces (${data.size} total):\n\n${workspaceList}`,
            },
          ],
        };
      }

      case 'bb_get_pull_requests': {
        const parsed = GetPullRequestsSchema.parse(args);
        const params = {
          state: parsed.state,
          page: parsed.page,
          pagelen: parsed.pagelen,
        };
        const url = addQueryParams(
          buildApiUrl(
            `/repositories/${parsed.workspace}/${parsed.repo_slug}/pullrequests`
          ),
          params
        );
        const data =
          await makeRequest<BitbucketApiResponse<BitbucketPullRequest>>(url);

        const prList = data.values
          .map(
            (pr: BitbucketPullRequest) =>
              `- #${pr.id}: ${pr.title}\n` +
              `  Author: ${pr.author.display_name}\n` +
              `  State: ${pr.state}\n` +
              `  Created: ${pr.created_on}\n` +
              `  Source: ${pr.source.branch.name} → ${pr.destination.branch.name}`
          )
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Pull requests for ${parsed.workspace}/${parsed.repo_slug} (${data.size} total):\n\n${prList}`,
            },
          ],
        };
      }

      case 'bb_get_pull_request': {
        const parsed = GetPullRequestSchema.parse(args);
        const url = buildApiUrl(
          `/repositories/${parsed.workspace}/${parsed.repo_slug}/pullrequests/${parsed.pull_request_id}`
        );
        const data = await makeRequest<BitbucketPullRequest>(url);

        return {
          content: [
            {
              type: 'text',
              text:
                `Pull Request #${data.id}: ${data.title}\n` +
                `Author: ${data.author.display_name}\n` +
                `State: ${data.state}\n` +
                `Created: ${data.created_on}\n` +
                `Updated: ${data.updated_on}\n` +
                `Source: ${data.source.branch.name} → ${data.destination.branch.name}\n` +
                `Description:\n${data.description || 'No description'}\n` +
                `Reviewers: ${data.reviewers?.map(r => r.display_name).join(', ') || 'None'}`,
            },
          ],
        };
      }

      case 'bb_get_pull_request_comments': {
        const parsed = GetPullRequestCommentsSchema.parse(args);
        const params = {
          page: parsed.page,
          pagelen: parsed.pagelen,
        };
        const url = addQueryParams(
          buildApiUrl(
            `/repositories/${parsed.workspace}/${parsed.repo_slug}/pullrequests/${parsed.pull_request_id}/comments`
          ),
          params
        );
        const data =
          await makeRequest<BitbucketApiResponse<BitbucketComment>>(url);

        const commentList = data.values
          .map(
            (comment: BitbucketComment) =>
              `- ${comment.user.display_name} (${comment.created_on}):\n` +
              `  ${comment.content?.raw || 'No content'}\n` +
              (comment.inline
                ? `  File: ${comment.inline.path}, Line: ${comment.inline.to || comment.inline.from}`
                : '')
          )
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Comments for PR #${parsed.pull_request_id} (${data.size} total):\n\n${commentList}`,
            },
          ],
        };
      }

      case 'bb_get_pull_request_activity': {
        const parsed = GetPullRequestActivitySchema.parse(args);
        const params = {
          page: parsed.page,
          pagelen: parsed.pagelen,
        };
        const url = addQueryParams(
          buildApiUrl(
            `/repositories/${parsed.workspace}/${parsed.repo_slug}/pullrequests/${parsed.pull_request_id}/activity`
          ),
          params
        );
        const data =
          await makeRequest<BitbucketApiResponse<BitbucketActivity>>(url);

        const activityList = data.values
          .map((activity: BitbucketActivity) => {
            // Handle cases where user might be undefined/null (system activities)
            const userName = activity.user?.display_name || 'System';
            const actionDate =
              activity.created_on || activity.update?.date || 'Unknown date';
            const action = activity.action || 'Activity';

            let activityText =
              `- ${userName} (${actionDate}):\n` + `  Action: ${action}`;

            // Add comment if present
            if (activity.comment) {
              activityText += `\n  Comment: ${activity.comment.content?.raw || 'No content'}`;
            }

            // Add approval if present
            if (activity.approval) {
              activityText += `\n  Approval: ${activity.approval.state || 'Unknown state'}`;
            }

            // Add update if present
            if (activity.update) {
              const updateAuthor =
                activity.update.author?.display_name || 'Unknown';
              activityText += `\n  Update: ${activity.update.state || 'Updated'} by ${updateAuthor}`;
              if (activity.update.title) {
                activityText += `\n  Title changed to: ${activity.update.title}`;
              }
            }

            return activityText;
          })
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Activity for PR #${parsed.pull_request_id} (${data.size} total):\n\n${activityList}`,
            },
          ],
        };
      }

      case 'bb_get_issues': {
        const parsed = GetIssuesSchema.parse(args);
        const params = {
          state: parsed.state,
          kind: parsed.kind,
          page: parsed.page,
          pagelen: parsed.pagelen,
        };
        const url = addQueryParams(
          buildApiUrl(
            `/repositories/${parsed.workspace}/${parsed.repo_slug}/issues`
          ),
          params
        );
        const data =
          await makeRequest<BitbucketApiResponse<BitbucketIssue>>(url);

        const issueList = data.values
          .map(
            (issue: BitbucketIssue) =>
              `- #${issue.id}: ${issue.title}\n` +
              `  State: ${issue.state}\n` +
              `  Kind: ${issue.kind}\n` +
              `  Priority: ${issue.priority}\n` +
              `  Reporter: ${issue.reporter.display_name}\n` +
              `  Assignee: ${issue.assignee?.display_name || 'Unassigned'}\n` +
              `  Created: ${issue.created_on}`
          )
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Issues for ${parsed.workspace}/${parsed.repo_slug} (${data.size} total):\n\n${issueList}`,
            },
          ],
        };
      }

      case 'bb_get_issue': {
        const parsed = GetIssueSchema.parse(args);
        const url = buildApiUrl(
          `/repositories/${parsed.workspace}/${parsed.repo_slug}/issues/${parsed.issue_id}`
        );
        const data = await makeRequest<BitbucketIssue>(url);

        return {
          content: [
            {
              type: 'text',
              text:
                `Issue #${data.id}: ${data.title}\n` +
                `State: ${data.state}\n` +
                `Kind: ${data.kind}\n` +
                `Priority: ${data.priority}\n` +
                `Reporter: ${data.reporter.display_name}\n` +
                `Assignee: ${data.assignee?.display_name || 'Unassigned'}\n` +
                `Created: ${data.created_on}\n` +
                `Updated: ${data.updated_on}\n` +
                `Content:\n${data.content?.raw || 'No content'}`,
            },
          ],
        };
      }

      case 'bb_get_commits': {
        const parsed = GetCommitsSchema.parse(args);
        const params = {
          page: parsed.page,
          pagelen: parsed.pagelen,
        };
        let url = buildApiUrl(
          `/repositories/${parsed.workspace}/${parsed.repo_slug}/commits`
        );
        if (parsed.branch) {
          url += `/${parsed.branch}`;
        }
        url = addQueryParams(url, params);
        const data =
          await makeRequest<BitbucketApiResponse<BitbucketCommit>>(url);

        const commitList = data.values
          .map(
            (commit: BitbucketCommit) =>
              `- ${commit.hash.substring(0, 8)}: ${commit.message.split('\n')[0]}\n` +
              `  Author: ${commit.author.user?.display_name || commit.author.raw}\n` +
              `  Date: ${commit.date}`
          )
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Commits for ${parsed.workspace}/${parsed.repo_slug}${parsed.branch ? ` (${parsed.branch})` : ''} (${data.size} total):\n\n${commitList}`,
            },
          ],
        };
      }

      case 'bb_get_branches': {
        const parsed = GetBranchesSchema.parse(args);
        const params = {
          page: parsed.page,
          pagelen: parsed.pagelen,
        };
        const url = addQueryParams(
          buildApiUrl(
            `/repositories/${parsed.workspace}/${parsed.repo_slug}/refs/branches`
          ),
          params
        );
        const data =
          await makeRequest<BitbucketApiResponse<BitbucketBranchWithTarget>>(
            url
          );

        const branchList = data.values
          .map(
            (branch: BitbucketBranchWithTarget) =>
              `- ${branch.name}\n` +
              `  Last commit: ${branch.target.hash.substring(0, 8)}\n` +
              `  Date: ${branch.target.date}`
          )
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Branches for ${parsed.workspace}/${parsed.repo_slug} (${data.size} total):\n\n${branchList}`,
            },
          ],
        };
      }

      case 'bb_get_file_content': {
        const parsed = GetFileContentSchema.parse(args);
        const ref = parsed.ref || 'HEAD';
        const url = buildApiUrl(
          `/repositories/${parsed.workspace}/${parsed.repo_slug}/src/${ref}/${parsed.file_path}`
        );

        // Use a custom request for text content instead of makeRequest which expects JSON
        const { loadConfig } = await import('./config.js');
        const config = loadConfig();
        const headers: Record<string, string> = {
          Accept: 'text/plain',
          'User-Agent': 'bitbucket-mcp-server/1.0.0',
        };

        // Add authentication if available
        const apiToken = config.BITBUCKET_API_TOKEN;
        const email = config.BITBUCKET_EMAIL;
        if (apiToken && email) {
          const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
          headers.Authorization = `Basic ${auth}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const content = await response.text();

        // Handle pagination
        const lines = content.split('\n');
        const start = parsed.start ? Math.max(1, parsed.start) : 1;
        const limit = parsed.limit
          ? Math.min(parsed.limit, API_CONSTANTS.MAX_FILE_LINES)
          : API_CONSTANTS.DEFAULT_FILE_LINES;
        const endLine = Math.min(start + limit - 1, lines.length);
        const paginatedLines = lines.slice(start - 1, endLine);

        return {
          content: [
            {
              type: 'text',
              text:
                `File: ${parsed.file_path} (lines ${start}-${endLine} of ${lines.length})\n` +
                `Repository: ${parsed.workspace}/${parsed.repo_slug}\n` +
                `Ref: ${ref}\n\n` +
                paginatedLines
                  .map((line, index) => `${start + index}: ${line}`)
                  .join('\n'),
            },
          ],
        };
      }

      case 'bb_browse_repository': {
        const parsed = BrowseRepositorySchema.parse(args);
        const ref = parsed.ref || 'master';
        const path = parsed.path || '';
        let url = buildApiUrl(
          `/repositories/${parsed.workspace}/${parsed.repo_slug}/src/${ref}`
        );
        if (path) {
          url += `/${path}`;
        }
        // Ensure trailing slash for directory browsing
        if (!url.endsWith('/')) {
          url += '/';
        }
        // Don't add 'at' parameter when ref is already in the URL path

        const data = await makeRequest<BitbucketSrcListingResponse>(url);

        const limit = parsed.limit
          ? Math.min(parsed.limit, API_CONSTANTS.MAX_BROWSE_ITEMS)
          : API_CONSTANTS.DEFAULT_BROWSE_ITEMS;
        const items = data.values.slice(0, limit);

        const itemList = items
          .map(item => {
            const isDir = item.type === 'commit_directory';
            const icon = isDir ? '📁' : '📄';
            const size = item.size ? ` (${item.size} bytes)` : '';
            return `${icon} ${item.path}${size}`;
          })
          .join('\n');

        return {
          content: [
            {
              type: 'text',
              text:
                `Repository: ${parsed.workspace}/${parsed.repo_slug}\n` +
                `Path: /${path}\n` +
                `Ref: ${ref}\n` +
                `Items (${items.length} of ${data.size || data.values.length} total):\n\n${itemList}`,
            },
          ],
        };
      }

      case 'bb_get_user': {
        const parsed = GetUserSchema.parse(args);

        // Bitbucket API v2.0 only supports getting current user info
        // The /users/{username} endpoint doesn't exist
        if (parsed.username) {
          throw new Error(
            `Getting user info by username is not supported by Bitbucket API v2.0. Use bb_get_current_user for current user or bb_get_workspace for workspace info.`
          );
        }

        const url = buildApiUrl('/user');
        const data = await makeRequest<BitbucketUser>(url);

        return {
          content: [
            {
              type: 'text',
              text:
                `User: ${data.display_name} (@${data.username})\n` +
                `Account ID: ${data.account_id}\n` +
                `Type: ${data.type}\n` +
                `Website: ${data.website || 'None'}\n` +
                `Location: ${data.location || 'Not specified'}\n` +
                `Created: ${data.created_on}`,
            },
          ],
        };
      }

      case 'bb_get_current_user': {
        const url = buildApiUrl('/user');
        const data = await makeRequest<BitbucketUser>(url);

        return {
          content: [
            {
              type: 'text',
              text:
                `Current User: ${data.display_name} (@${data.username})\n` +
                `Account ID: ${data.account_id}\n` +
                `Type: ${data.type}\n` +
                `Website: ${data.website || 'None'}\n` +
                `Location: ${data.location || 'Not specified'}\n` +
                `Created: ${data.created_on}`,
            },
          ],
        };
      }

      case 'bb_search_repositories': {
        const parsed = SearchRepositoriesSchema.parse(args);

        // Bitbucket API v2.0 doesn't have workspace-scoped repository search
        // Instead, list all repositories in workspace and filter client-side
        const params = {
          page: parsed.page,
          pagelen: parsed.pagelen,
        };

        const url = addQueryParams(
          buildApiUrl(`/repositories/${parsed.workspace}`),
          params
        );

        const data =
          await makeRequest<BitbucketApiResponse<BitbucketRepository>>(url);

        // Filter repositories based on search query
        const searchLower = parsed.query.toLowerCase();
        const filteredRepos = data.values.filter(
          (repo: BitbucketRepository) => {
            const nameMatch = repo.name.toLowerCase().includes(searchLower);
            const descMatch =
              repo.description?.toLowerCase().includes(searchLower) || false;
            const fullNameMatch = repo.full_name
              .toLowerCase()
              .includes(searchLower);
            return nameMatch || descMatch || fullNameMatch;
          }
        );

        const repoList = filteredRepos
          .map(
            (repo: BitbucketRepository) =>
              `- ${repo.full_name} (${repo.language || 'Unknown'})\n` +
              `  ${repo.description || 'No description'}\n` +
              `  Private: ${repo.is_private}, Updated: ${repo.updated_on}`
          )
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Search results for "${parsed.query}" in ${parsed.workspace} (${filteredRepos.length} of ${data.values.length} total):\n\n${repoList || 'No repositories found matching the search query.'}`,
            },
          ],
        };
      }

      case 'bb_search_code': {
        const parsed = SearchCodeSchema.parse(args);
        const params = {
          search_query: parsed.search_query,
          page: parsed.page,
          pagelen: parsed.pagelen,
        };

        if (parsed.repo_slug) {
          params.search_query += ` repo:${parsed.repo_slug}`;
        }
        if (parsed.language) {
          params.search_query += ` language:${parsed.language}`;
        }
        if (parsed.extension) {
          params.search_query += ` extension:${parsed.extension}`;
        }

        const url = addQueryParams(
          buildApiUrl(`/workspaces/${parsed.workspace}/search/code`),
          params
        );
        const data = await makeRequest<CodeSearchResponse>(url);

        const resultList = data.values
          .map(result => {
            const matchCount = result.content_match_count;
            const filePath = result.file.path;
            const matches = result.content_matches
              .map(match =>
                match.lines
                  .map(line => {
                    const lineText = line.segments
                      .map(seg => (seg.match ? `**${seg.text}**` : seg.text))
                      .join('');
                    return `    Line ${line.line}: ${lineText}`;
                  })
                  .join('\n')
              )
              .join('\n');

            return `📄 ${filePath} (${matchCount} matches)\n${matches}`;
          })
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Code search results for "${parsed.search_query}" in ${parsed.workspace} (${data.values.length} results):\n\n${resultList}`,
            },
          ],
        };
      }

      case 'bb_get_workspace': {
        const parsed = GetWorkspaceSchema.parse(args);
        const url = buildApiUrl(`/workspaces/${parsed.workspace}`);
        const data = await makeRequest<BitbucketWorkspace>(url);

        return {
          content: [
            {
              type: 'text',
              text:
                `Workspace: ${data.name} (${data.slug})\n` +
                `Type: ${data.type}\n` +
                `UUID: ${data.uuid || 'Not available'}\n` +
                `Created: ${data.created_on || 'Unknown'}`,
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
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
