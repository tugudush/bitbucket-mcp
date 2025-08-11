#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Bitbucket API configuration
const BITBUCKET_API_BASE = 'https://api.bitbucket.org/2.0';

// TypeScript interfaces for Bitbucket API responses
interface BitbucketUser {
  display_name: string;
  username: string;
  account_id: string;
  type: string;
  website?: string;
  location?: string;
  created_on: string;
}

interface BitbucketRepository {
  full_name: string;
  name: string;
  description?: string;
  language?: string;
  size?: number;
  created_on: string;
  updated_on: string;
  is_private: boolean;
  parent?: BitbucketRepository;
  forks_count?: number;
  watchers_count?: number;
  website?: string;
  links?: {
    clone?: Array<{ name: string; href: string }>;
  };
}

interface BitbucketBranch {
  name: string;
}

interface BitbucketPullRequest {
  id: number;
  title: string;
  state: string;
  author: BitbucketUser;
  created_on: string;
  updated_on: string;
  description?: string;
  source: { branch: BitbucketBranch };
  destination: { branch: BitbucketBranch };
  reviewers?: BitbucketUser[];
}

interface BitbucketComment {
  user: BitbucketUser;
  created_on: string;
  content?: {
    raw?: string;
    markup?: string;
  };
  inline?: {
    path: string;
    to?: number;
    from?: number;
  };
  parent?: {
    id: number;
  };
}

interface BitbucketActivity {
  update?: {
    date: string;
    author: BitbucketUser;
    state?: string;
    title?: string;
    reviewers?: BitbucketUser[];
  };
  comment?: BitbucketComment;
  approval?: {
    state: string;
  };
}

interface BitbucketIssue {
  id: number;
  title: string;
  state: string;
  kind: string;
  priority: string;
  reporter: BitbucketUser;
  assignee?: BitbucketUser;
  created_on: string;
  updated_on: string;
  content?: {
    raw?: string;
  };
}

interface BitbucketCommit {
  hash: string;
  message: string;
  date: string;
  author: {
    user?: BitbucketUser;
    raw: string;
  };
}

interface BitbucketBranchWithTarget {
  name: string;
  target: {
    hash: string;
    date: string;
  };
}

interface BitbucketSearchResult {
  file: {
    path: string;
  };
  line_number: number;
  content_match_text: string;
}

interface BitbucketWorkspace {
  name: string;
  slug: string;
  uuid: string;
  type: string;
  created_on: string;
}

interface BitbucketApiResponse<T> {
  values: T[];
  page?: number;
  size: number;
  next?: string;
  previous?: string;
  pagelen?: number;
}

// Items returned by the Bitbucket
// /repositories/{workspace}/{repo_slug}/src/{ref}/{path} endpoint
type BitbucketSrcItemType =
  | 'commit_file'
  | 'commit_directory'
  | 'commit_submodule'
  | 'commit_link';

interface BitbucketSrcItem {
  type: BitbucketSrcItemType;
  path: string;
  size?: number; // only for files
}

interface BitbucketSrcListingResponse {
  values: BitbucketSrcItem[];
  page?: number;
  size?: number;
  pagelen?: number;
  next?: string;
  previous?: string;
}

// Input schemas for Bitbucket tools
const GetRepositorySchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
});

const ListRepositoriesSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z.number().optional().describe('Number of items per page (max 100)'),
});

const GetPullRequestsSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  state: z
    .enum(['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED'])
    .optional()
    .describe('Filter by pull request state'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z.number().optional().describe('Number of items per page (max 100)'),
});

const GetPullRequestSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  pull_request_id: z.number().describe('The pull request ID'),
});

const GetPullRequestCommentsSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  pull_request_id: z.number().describe('The pull request ID'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z.number().optional().describe('Number of items per page (max 100)'),
});

const GetPullRequestActivitySchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  pull_request_id: z.number().describe('The pull request ID'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z.number().optional().describe('Number of items per page (max 100)'),
});

const GetIssuesSchema = z.object({
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
  pagelen: z.number().optional().describe('Number of items per page (max 100)'),
});

const GetIssueSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  issue_id: z.number().describe('The issue ID'),
});

const GetCommitsSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  branch: z
    .string()
    .optional()
    .describe('Branch name (defaults to main branch)'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z.number().optional().describe('Number of items per page (max 100)'),
});

const GetBranchesSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z.number().optional().describe('Number of items per page (max 100)'),
});

const GetFileContentSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  file_path: z.string().describe('Path to the file in the repository'),
  ref: z
    .string()
    .optional()
    .describe('Branch, tag, or commit hash (defaults to main branch)'),
});

const ListDirectorySchema = z.object({
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
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z.number().optional().describe('Number of items per page (max 100)'),
  recursive: z
    .boolean()
    .optional()
    .describe('When true, recursively lists all files under the path'),
});

const SearchCodeSchema = z.object({
  workspace: z.string().describe('The workspace or username'),
  repo_slug: z.string().describe('The repository name'),
  search_query: z.string().describe('The search query'),
  page: z.number().optional().describe('Page number for pagination'),
  pagelen: z.number().optional().describe('Number of items per page (max 100)'),
});

const GetUserSchema = z.object({
  username: z.string().describe('The username to get information about'),
});

const GetWorkspaceSchema = z.object({
  workspace: z.string().describe('The workspace name'),
});

// Helper function to make authenticated requests to Bitbucket API
async function makeRequest<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Enforce read-only behavior: block any non-GET methods at runtime
  const requestedMethod = (options.method || 'GET').toString().toUpperCase();
  if (requestedMethod !== 'GET') {
    throw new Error(
      `Write operations are disabled: attempted ${requestedMethod} ${url}. This MCP server allows only GET requests.`
    );
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'bitbucket-mcp-server/1.0.0',
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add authentication if available
  // Priority: API Token (Basic auth with email) > App Password (Basic auth with username)
  const apiToken = process.env.BITBUCKET_API_TOKEN;
  const email = process.env.BITBUCKET_EMAIL;
  const username = process.env.BITBUCKET_USERNAME;
  const appPassword = process.env.BITBUCKET_APP_PASSWORD;

  if (apiToken && email) {
    // Use API Token with Basic authentication (recommended)
    // Username should be your Atlassian email, password is the API token
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
    headers.Authorization = `Basic ${auth}`;
  } else if (username && appPassword) {
    // Fallback to App Password with Basic authentication (legacy)
    const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
    headers.Authorization = `Basic ${auth}`;
  }

  const response = await fetch(url, {
    ...options,
    // Force GET to prevent accidental method overrides downstream
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Bitbucket API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return await response.json();
}

// Create server instance
const server = new Server(
  {
    name: 'bitbucket-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'bb_get_repository',
        description: 'Get detailed information about a specific repository',
        inputSchema: zodToJsonSchema(GetRepositorySchema),
      },
      {
        name: 'bb_list_repositories',
        description: 'List repositories in a workspace',
        inputSchema: zodToJsonSchema(ListRepositoriesSchema),
      },
      {
        name: 'bb_get_pull_requests',
        description: 'Get pull requests for a repository',
        inputSchema: zodToJsonSchema(GetPullRequestsSchema),
      },
      {
        name: 'bb_get_pull_request',
        description: 'Get detailed information about a specific pull request',
        inputSchema: zodToJsonSchema(GetPullRequestSchema),
      },
      {
        name: 'bb_get_pull_request_comments',
        description: 'Get comments for a specific pull request',
        inputSchema: zodToJsonSchema(GetPullRequestCommentsSchema),
      },
      {
        name: 'bb_get_pull_request_activity',
        description:
          'Get activity (reviews, approvals, comments) for a specific pull request',
        inputSchema: zodToJsonSchema(GetPullRequestActivitySchema),
      },
      {
        name: 'bb_get_issues',
        description: 'Get issues for a repository',
        inputSchema: zodToJsonSchema(GetIssuesSchema),
      },
      {
        name: 'bb_get_issue',
        description: 'Get detailed information about a specific issue',
        inputSchema: zodToJsonSchema(GetIssueSchema),
      },
      {
        name: 'bb_get_commits',
        description: 'Get commits for a repository branch',
        inputSchema: zodToJsonSchema(GetCommitsSchema),
      },
      {
        name: 'bb_get_branches',
        description: 'Get branches for a repository',
        inputSchema: zodToJsonSchema(GetBranchesSchema),
      },
      {
        name: 'bb_get_file_content',
        description: 'Get the content of a file from a repository',
        inputSchema: zodToJsonSchema(GetFileContentSchema),
      },
      {
        name: 'bb_search_code',
        description: 'Search for code in a repository',
        inputSchema: zodToJsonSchema(SearchCodeSchema),
      },
      {
        name: 'bb_list_directory',
        description:
          'List files and folders in a repository path (optionally recursive)',
        inputSchema: zodToJsonSchema(ListDirectorySchema),
      },
      {
        name: 'bb_get_user',
        description: 'Get information about a Bitbucket user',
        inputSchema: zodToJsonSchema(GetUserSchema),
      },
      {
        name: 'bb_get_workspace',
        description: 'Get information about a workspace',
        inputSchema: zodToJsonSchema(GetWorkspaceSchema),
      },
    ],
  };
});

// Tool implementations
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'bb_get_repository': {
        const parsed = GetRepositorySchema.parse(args);
        const url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}`;
        const repo = await makeRequest<BitbucketRepository>(url);

        return {
          content: [
            {
              type: 'text',
              text:
                `Repository: ${repo.full_name}\n` +
                `Description: ${repo.description || 'No description'}\n` +
                `Language: ${repo.language || 'Not specified'}\n` +
                `Size: ${repo.size || 0} bytes\n` +
                `Created: ${repo.created_on}\n` +
                `Updated: ${repo.updated_on}\n` +
                `Private: ${repo.is_private}\n` +
                `Fork: ${repo.parent ? 'Yes' : 'No'}\n` +
                `Forks: ${repo.forks_count || 0}\n` +
                `Watchers: ${repo.watchers_count || 0}\n` +
                `Clone URL (HTTPS): ${repo.links?.clone?.find(link => link.name === 'https')?.href}\n` +
                `Website: ${repo.website || 'None'}`,
            },
          ],
        };
      }

      case 'bb_list_repositories': {
        const parsed = ListRepositoriesSchema.parse(args);
        const params = new URLSearchParams();
        if (parsed.page) params.append('page', parsed.page.toString());
        if (parsed.pagelen)
          params.append('pagelen', Math.min(parsed.pagelen, 100).toString());

        const url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}?${params}`;
        const data =
          await makeRequest<BitbucketApiResponse<BitbucketRepository>>(url);

        const repoList = data.values
          .map(
            (repo: BitbucketRepository) =>
              `- ${repo.name} (${repo.full_name})\n` +
              `  Description: ${repo.description || 'No description'}\n` +
              `  Language: ${repo.language || 'Not specified'}\n` +
              `  Private: ${repo.is_private}\n` +
              `  Updated: ${repo.updated_on}`
          )
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text:
                `Repositories in ${parsed.workspace}:\n\n${repoList}\n\n` +
                `Page: ${data.page}/${Math.ceil(data.size / (parsed.pagelen || 10))}\n` +
                `Total: ${data.size} repositories`,
            },
          ],
        };
      }

      case 'bb_get_pull_requests': {
        const parsed = GetPullRequestsSchema.parse(args);
        const params = new URLSearchParams();
        if (parsed.state) params.append('state', parsed.state);
        if (parsed.page) params.append('page', parsed.page.toString());
        if (parsed.pagelen)
          params.append('pagelen', Math.min(parsed.pagelen, 100).toString());

        const url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}/pullrequests?${params}`;
        const data =
          await makeRequest<BitbucketApiResponse<BitbucketPullRequest>>(url);

        const prList = data.values
          .map(
            (pr: BitbucketPullRequest) =>
              `- #${pr.id}: ${pr.title}\n` +
              `  Author: ${pr.author.display_name}\n` +
              `  State: ${pr.state}\n` +
              `  Source: ${pr.source.branch.name} → ${pr.destination.branch.name}\n` +
              `  Created: ${pr.created_on}\n` +
              `  Updated: ${pr.updated_on}`
          )
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text:
                `Pull Requests for ${parsed.workspace}/${parsed.repo_slug}:\n\n${prList}\n\n` +
                `Page: ${data.page}\n` +
                `Total: ${data.size} pull requests`,
            },
          ],
        };
      }

      case 'bb_get_pull_request': {
        const parsed = GetPullRequestSchema.parse(args);
        const url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}/pullrequests/${parsed.pull_request_id}`;
        const pr = await makeRequest<BitbucketPullRequest>(url);

        return {
          content: [
            {
              type: 'text',
              text:
                `Pull Request #${pr.id}: ${pr.title}\n\n` +
                `Author: ${pr.author.display_name}\n` +
                `State: ${pr.state}\n` +
                `Source: ${pr.source.branch.name} → ${pr.destination.branch.name}\n` +
                `Created: ${pr.created_on}\n` +
                `Updated: ${pr.updated_on}\n` +
                `Reviewers: ${pr.reviewers?.map(r => r.display_name).join(', ') || 'None'}\n\n` +
                `Description:\n${pr.description || 'No description'}`,
            },
          ],
        };
      }

      case 'bb_get_pull_request_comments': {
        const parsed = GetPullRequestCommentsSchema.parse(args);
        const params = new URLSearchParams();
        if (parsed.page) params.append('page', parsed.page.toString());
        if (parsed.pagelen)
          params.append('pagelen', Math.min(parsed.pagelen, 100).toString());

        const url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}/pullrequests/${parsed.pull_request_id}/comments?${params}`;
        const data =
          await makeRequest<BitbucketApiResponse<BitbucketComment>>(url);

        const commentList = data.values
          .map(
            (comment: BitbucketComment) =>
              `- Comment by ${comment.user.display_name} (${comment.created_on}):\n` +
              `  ${comment.content?.raw || comment.content?.markup || 'No content'}\n` +
              (comment.inline
                ? `  File: ${comment.inline.path} (Line ${comment.inline.to || comment.inline.from})\n`
                : '') +
              (comment.parent
                ? `  Reply to comment #${comment.parent.id}\n`
                : '')
          )
          .join('\n');

        return {
          content: [
            {
              type: 'text',
              text:
                `Comments for Pull Request #${parsed.pull_request_id} in ${parsed.workspace}/${parsed.repo_slug}:\n\n${commentList}\n\n` +
                `Page: ${data.page || 1}\n` +
                `Total: ${data.size || 0} comments`,
            },
          ],
        };
      }

      case 'bb_get_pull_request_activity': {
        const parsed = GetPullRequestActivitySchema.parse(args);
        const params = new URLSearchParams();
        if (parsed.page) params.append('page', parsed.page.toString());
        if (parsed.pagelen)
          params.append('pagelen', Math.min(parsed.pagelen, 100).toString());

        const url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}/pullrequests/${parsed.pull_request_id}/activity?${params}`;
        const data =
          await makeRequest<BitbucketApiResponse<BitbucketActivity>>(url);

        const activityList = data.values
          .map((activity: BitbucketActivity) => {
            let activityText = `- ${activity.update?.date || activity.comment?.created_on || 'Unknown date'}`;

            if (activity.update) {
              activityText += ` - ${activity.update.author.display_name}`;
              if (activity.update.state) {
                activityText += ` changed state to: ${activity.update.state}`;
              }
              if (activity.update.title) {
                activityText += ` updated title to: "${activity.update.title}"`;
              }
              if (activity.update.reviewers) {
                const reviewers = activity.update.reviewers
                  .map(r => r.display_name)
                  .join(', ');
                activityText += ` updated reviewers: ${reviewers}`;
              }
              if (activity.approval) {
                activityText += ` ${activity.approval.state === 'approved' ? 'approved' : 'requested changes'}`;
              }
            } else if (activity.comment) {
              activityText += ` - ${activity.comment.user.display_name} commented:\n`;
              activityText += `  "${activity.comment.content?.raw || activity.comment.content?.markup || 'No content'}"`;
              if (activity.comment.inline) {
                activityText += `\n  (On file: ${activity.comment.inline.path}, line ${activity.comment.inline.to || activity.comment.inline.from})`;
              }
            }

            return activityText;
          })
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text:
                `Activity for Pull Request #${parsed.pull_request_id} in ${parsed.workspace}/${parsed.repo_slug}:\n\n${activityList}\n\n` +
                `Page: ${data.page || 1}\n` +
                `Total: ${data.size || 0} activity items`,
            },
          ],
        };
      }

      case 'bb_get_issues': {
        const parsed = GetIssuesSchema.parse(args);
        const params = new URLSearchParams();
        if (parsed.state) params.append('state', parsed.state);
        if (parsed.kind) params.append('kind', parsed.kind);
        if (parsed.page) params.append('page', parsed.page.toString());
        if (parsed.pagelen)
          params.append('pagelen', Math.min(parsed.pagelen, 100).toString());

        const url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}/issues?${params}`;
        const data =
          await makeRequest<BitbucketApiResponse<BitbucketIssue>>(url);

        const issueList = data.values
          .map(
            (issue: BitbucketIssue) =>
              `- #${issue.id}: ${issue.title}\n` +
              `  Reporter: ${issue.reporter.display_name}\n` +
              `  State: ${issue.state}\n` +
              `  Kind: ${issue.kind}\n` +
              `  Priority: ${issue.priority}\n` +
              `  Created: ${issue.created_on}\n` +
              `  Updated: ${issue.updated_on}`
          )
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text:
                `Issues for ${parsed.workspace}/${parsed.repo_slug}:\n\n${issueList}\n\n` +
                `Page: ${data.page}\n` +
                `Total: ${data.size} issues`,
            },
          ],
        };
      }

      case 'bb_get_issue': {
        const parsed = GetIssueSchema.parse(args);
        const url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}/issues/${parsed.issue_id}`;
        const issue = await makeRequest<BitbucketIssue>(url);

        return {
          content: [
            {
              type: 'text',
              text:
                `Issue #${issue.id}: ${issue.title}\n\n` +
                `Reporter: ${issue.reporter.display_name}\n` +
                `Assignee: ${issue.assignee?.display_name || 'Unassigned'}\n` +
                `State: ${issue.state}\n` +
                `Kind: ${issue.kind}\n` +
                `Priority: ${issue.priority}\n` +
                `Created: ${issue.created_on}\n` +
                `Updated: ${issue.updated_on}\n\n` +
                `Description:\n${issue.content?.raw || 'No description'}`,
            },
          ],
        };
      }

      case 'bb_get_commits': {
        const parsed = GetCommitsSchema.parse(args);
        const params = new URLSearchParams();
        if (parsed.page) params.append('page', parsed.page.toString());
        if (parsed.pagelen)
          params.append('pagelen', Math.min(parsed.pagelen, 100).toString());

        let url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}/commits`;
        if (parsed.branch) {
          url += `/${parsed.branch}`;
        }
        url += `?${params}`;

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
              text:
                `Commits for ${parsed.workspace}/${parsed.repo_slug}${parsed.branch ? ` (${parsed.branch})` : ''}:\n\n${commitList}\n\n` +
                `Page: ${data.page}\n` +
                `Total: ${data.size} commits`,
            },
          ],
        };
      }

      case 'bb_get_branches': {
        const parsed = GetBranchesSchema.parse(args);
        const params = new URLSearchParams();
        if (parsed.page) params.append('page', parsed.page.toString());
        if (parsed.pagelen)
          params.append('pagelen', Math.min(parsed.pagelen, 100).toString());

        const url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}/refs/branches?${params}`;
        const data =
          await makeRequest<BitbucketApiResponse<BitbucketBranchWithTarget>>(
            url
          );

        const branchList = data.values
          .map(
            (branch: BitbucketBranchWithTarget) =>
              `- ${branch.name}\n` +
              `  Target: ${branch.target.hash.substring(0, 8)}\n` +
              `  Date: ${branch.target.date}`
          )
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text:
                `Branches for ${parsed.workspace}/${parsed.repo_slug}:\n\n${branchList}\n\n` +
                `Page: ${data.page}\n` +
                `Total: ${data.size} branches`,
            },
          ],
        };
      }

      case 'bb_get_file_content': {
        const parsed = GetFileContentSchema.parse(args);

        // Build URL with ref in path: /repositories/{workspace}/{repo_slug}/src/{ref}/{file_path}
        const ref = parsed.ref || 'HEAD';
        let url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}/src/${ref}/${parsed.file_path}`;

        // We need to use a custom fetch with authentication since makeRequest expects JSON
        const headers: Record<string, string> = {
          Accept: 'text/plain',
          'User-Agent': 'bitbucket-mcp-server/1.0.0',
        };

        // Add authentication if available (copied from makeRequest logic)
        const apiToken = process.env.BITBUCKET_API_TOKEN;
        const email = process.env.BITBUCKET_EMAIL;
        const username = process.env.BITBUCKET_USERNAME;
        const appPassword = process.env.BITBUCKET_APP_PASSWORD;

        if (apiToken && email) {
          const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
          headers.Authorization = `Basic ${auth}`;
        } else if (username && appPassword) {
          const auth = Buffer.from(`${username}:${appPassword}`).toString(
            'base64'
          );
          headers.Authorization = `Basic ${auth}`;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch file: ${response.status} ${response.statusText}`
          );
        }

        const content = await response.text();

        return {
          content: [
            {
              type: 'text',
              text:
                `File: ${parsed.file_path}\n` +
                `Repository: ${parsed.workspace}/${parsed.repo_slug}\n` +
                `Reference: ${parsed.ref || 'default branch'}\n\n` +
                `Content:\n\`\`\`\n${content}\n\`\`\``,
            },
          ],
        };
      }

      case 'bb_list_directory': {
        const parsed = ListDirectorySchema.parse(args);

        const buildListingUrl = (page?: number) => {
          const params = new URLSearchParams();
          if (parsed.ref) params.append('at', parsed.ref);
          if (page) params.append('page', page.toString());
          if (parsed.pagelen)
            params.append('pagelen', Math.min(parsed.pagelen, 100).toString());

          let url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}/src`;
          if (parsed.path) url += `/${parsed.path.replace(/^\/+|\/+$/g, '')}`;
          if (params.toString()) url += `?${params}`;
          return url;
        };

        async function listOneLevel() {
          const items: BitbucketSrcItem[] = [];
          let page = parsed.page;
          while (true) {
            const url = buildListingUrl(page);
            // The Bitbucket "src" endpoint returns a listing object with { values: BitbucketSrcItem[], ... }
            const data = await makeRequest<BitbucketSrcListingResponse>(url);

            if (data && data.values && Array.isArray(data.values)) {
              items.push(...data.values);
              if (!data.next) break;
              // Advance to next page if server provided a next link
              page = (page || 1) + 1;
              continue;
            }

            // No more data or unexpected response format
            break;
          }
          return items;
        }

        let results: BitbucketSrcItem[] = [];
        if (parsed.recursive) {
          // BFS traversal starting at the provided path
          const queue: string[] = [parsed.path || ''];
          while (queue.length) {
            const current = queue.shift()!;
            const originalPath = parsed.path;
            // Temporarily set path for this iteration
            (parsed.path as string | undefined) = current;
            const items = await listOneLevel();
            results.push(...items.filter(i => i.type !== 'commit_directory'));
            const dirs = items.filter(i => i.type === 'commit_directory');
            for (const d of dirs) {
              queue.push(d.path);
            }
            parsed.path = originalPath;
          }
        } else {
          results = await listOneLevel();
        }

        // Render a friendly text output
        const headerPath = parsed.path ? parsed.path.replace(/^\/+/, '') : '/';
        const lines = results
          .sort((a, b) => a.path.localeCompare(b.path))
          .map(item => {
            const name = item.path.split('/').pop() || item.path;
            if (item.type === 'commit_directory') {
              return `📁 ${name}/  - ${item.path}`;
            }
            const size = item.size != null ? ` (${item.size} bytes)` : '';
            return `📄 ${name}${size}  - ${item.path}`;
          })
          .join('\n');

        return {
          content: [
            {
              type: 'text',
              text:
                `Directory listing for ${parsed.workspace}/${parsed.repo_slug} at ${parsed.ref || 'default branch'}:\n` +
                `Path: ${headerPath}  •  Items: ${results.length}\n` +
                `${lines || '(empty)'}`,
            },
          ],
        };
      }

      case 'bb_search_code': {
        const parsed = SearchCodeSchema.parse(args);
        const params = new URLSearchParams();
        params.append('search_query', parsed.search_query);
        if (parsed.page) params.append('page', parsed.page.toString());
        if (parsed.pagelen)
          params.append('pagelen', Math.min(parsed.pagelen, 100).toString());

        const url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}/search/code?${params}`;
        const data =
          await makeRequest<BitbucketApiResponse<BitbucketSearchResult>>(url);

        const resultList = data.values
          .map(
            (result: BitbucketSearchResult) =>
              `- File: ${result.file.path}\n` +
              `  Line: ${result.line_number}\n` +
              `  Content: ${result.content_match_text}`
          )
          .join('\n\n');

        return {
          content: [
            {
              type: 'text',
              text:
                `Code search results for "${parsed.search_query}" in ${parsed.workspace}/${parsed.repo_slug}:\n\n${resultList}\n\n` +
                `Page: ${data.page}\n` +
                `Total: ${data.size} results`,
            },
          ],
        };
      }

      case 'bb_get_user': {
        const parsed = GetUserSchema.parse(args);
        const url = `${BITBUCKET_API_BASE}/users/${parsed.username}`;
        const user = await makeRequest<BitbucketUser>(url);

        return {
          content: [
            {
              type: 'text',
              text:
                `User: ${user.display_name} (@${user.username})\n` +
                `Account ID: ${user.account_id}\n` +
                `Type: ${user.type}\n` +
                `Website: ${user.website || 'None'}\n` +
                `Location: ${user.location || 'Not specified'}\n` +
                `Created: ${user.created_on}`,
            },
          ],
        };
      }

      case 'bb_get_workspace': {
        const parsed = GetWorkspaceSchema.parse(args);
        const url = `${BITBUCKET_API_BASE}/workspaces/${parsed.workspace}`;
        const workspace = await makeRequest<BitbucketWorkspace>(url);

        return {
          content: [
            {
              type: 'text',
              text:
                `Workspace: ${workspace.name}\n` +
                `Slug: ${workspace.slug}\n` +
                `UUID: ${workspace.uuid}\n` +
                `Type: ${workspace.type}\n` +
                `Created: ${workspace.created_on}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
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
});

// Start the server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Bitbucket MCP Server running on stdio');
  console.error(
    'Note: Set BITBUCKET_API_TOKEN+BITBUCKET_EMAIL (recommended) or BITBUCKET_USERNAME+BITBUCKET_APP_PASSWORD for authenticated requests'
  );

  // Debug: Log environment variables
  console.error('Debug - Environment variables:');
  console.error(
    '  BITBUCKET_API_TOKEN:',
    process.env.BITBUCKET_API_TOKEN
      ? 'SET (length: ' + process.env.BITBUCKET_API_TOKEN.length + ')'
      : 'NOT SET'
  );
  console.error('  BITBUCKET_EMAIL:', process.env.BITBUCKET_EMAIL || 'NOT SET');
  console.error(
    '  BITBUCKET_USERNAME:',
    process.env.BITBUCKET_USERNAME || 'NOT SET'
  );
  console.error(
    '  BITBUCKET_APP_PASSWORD:',
    process.env.BITBUCKET_APP_PASSWORD ? 'SET' : 'NOT SET'
  );
}

runServer().catch(error => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
