#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Bitbucket API configuration
const BITBUCKET_API_BASE = "https://api.bitbucket.org/2.0";

// Input schemas for Bitbucket tools
const GetRepositorySchema = z.object({
  workspace: z.string().describe("The workspace or username"),
  repo_slug: z.string().describe("The repository name"),
});

const ListRepositoriesSchema = z.object({
  workspace: z.string().describe("The workspace or username"),
  page: z.number().optional().describe("Page number for pagination"),
  pagelen: z.number().optional().describe("Number of items per page (max 100)"),
});

const GetPullRequestsSchema = z.object({
  workspace: z.string().describe("The workspace or username"),
  repo_slug: z.string().describe("The repository name"),
  state: z.enum(["OPEN", "MERGED", "DECLINED", "SUPERSEDED"]).optional().describe("Filter by pull request state"),
  page: z.number().optional().describe("Page number for pagination"),
  pagelen: z.number().optional().describe("Number of items per page (max 100)"),
});

const GetPullRequestSchema = z.object({
  workspace: z.string().describe("The workspace or username"),
  repo_slug: z.string().describe("The repository name"),
  pull_request_id: z.number().describe("The pull request ID"),
});

const GetIssuesSchema = z.object({
  workspace: z.string().describe("The workspace or username"),
  repo_slug: z.string().describe("The repository name"),
  state: z.enum(["new", "open", "resolved", "on hold", "invalid", "duplicate", "wontfix", "closed"]).optional().describe("Filter by issue state"),
  kind: z.enum(["bug", "enhancement", "proposal", "task"]).optional().describe("Filter by issue kind"),
  page: z.number().optional().describe("Page number for pagination"),
  pagelen: z.number().optional().describe("Number of items per page (max 100)"),
});

const GetIssueSchema = z.object({
  workspace: z.string().describe("The workspace or username"),
  repo_slug: z.string().describe("The repository name"),
  issue_id: z.number().describe("The issue ID"),
});

const GetCommitsSchema = z.object({
  workspace: z.string().describe("The workspace or username"),
  repo_slug: z.string().describe("The repository name"),
  branch: z.string().optional().describe("Branch name (defaults to main branch)"),
  page: z.number().optional().describe("Page number for pagination"),
  pagelen: z.number().optional().describe("Number of items per page (max 100)"),
});

const GetBranchesSchema = z.object({
  workspace: z.string().describe("The workspace or username"),
  repo_slug: z.string().describe("The repository name"),
  page: z.number().optional().describe("Page number for pagination"),
  pagelen: z.number().optional().describe("Number of items per page (max 100)"),
});

const GetFileContentSchema = z.object({
  workspace: z.string().describe("The workspace or username"),
  repo_slug: z.string().describe("The repository name"),
  file_path: z.string().describe("Path to the file in the repository"),
  ref: z.string().optional().describe("Branch, tag, or commit hash (defaults to main branch)"),
});

const SearchCodeSchema = z.object({
  workspace: z.string().describe("The workspace or username"),
  repo_slug: z.string().describe("The repository name"),
  search_query: z.string().describe("The search query"),
  page: z.number().optional().describe("Page number for pagination"),
  pagelen: z.number().optional().describe("Number of items per page (max 100)"),
});

const GetUserSchema = z.object({
  username: z.string().describe("The username to get information about"),
});

const GetWorkspaceSchema = z.object({
  workspace: z.string().describe("The workspace name"),
});

// Helper function to make authenticated requests to Bitbucket API
async function makeRequest(url: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    "Accept": "application/json",
    "User-Agent": "bitbucket-mcp-server/1.0.0",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add authentication if available
  const username = process.env.BITBUCKET_USERNAME;
  const appPassword = process.env.BITBUCKET_APP_PASSWORD;
  
  if (username && appPassword) {
    const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
    headers.Authorization = `Basic ${auth}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bitbucket API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

// Create server instance
const server = new Server({
  name: "bitbucket-mcp-server",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
  },
});

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_repository",
        description: "Get detailed information about a specific repository",
        inputSchema: zodToJsonSchema(GetRepositorySchema),
      },
      {
        name: "list_repositories",
        description: "List repositories in a workspace",
        inputSchema: zodToJsonSchema(ListRepositoriesSchema),
      },
      {
        name: "get_pull_requests",
        description: "Get pull requests for a repository",
        inputSchema: zodToJsonSchema(GetPullRequestsSchema),
      },
      {
        name: "get_pull_request",
        description: "Get detailed information about a specific pull request",
        inputSchema: zodToJsonSchema(GetPullRequestSchema),
      },
      {
        name: "get_issues",
        description: "Get issues for a repository",
        inputSchema: zodToJsonSchema(GetIssuesSchema),
      },
      {
        name: "get_issue",
        description: "Get detailed information about a specific issue",
        inputSchema: zodToJsonSchema(GetIssueSchema),
      },
      {
        name: "get_commits",
        description: "Get commits for a repository branch",
        inputSchema: zodToJsonSchema(GetCommitsSchema),
      },
      {
        name: "get_branches",
        description: "Get branches for a repository",
        inputSchema: zodToJsonSchema(GetBranchesSchema),
      },
      {
        name: "get_file_content",
        description: "Get the content of a file from a repository",
        inputSchema: zodToJsonSchema(GetFileContentSchema),
      },
      {
        name: "search_code",
        description: "Search for code in a repository",
        inputSchema: zodToJsonSchema(SearchCodeSchema),
      },
      {
        name: "get_user",
        description: "Get information about a Bitbucket user",
        inputSchema: zodToJsonSchema(GetUserSchema),
      },
      {
        name: "get_workspace",
        description: "Get information about a workspace",
        inputSchema: zodToJsonSchema(GetWorkspaceSchema),
      },
    ],
  };
});

// Tool implementations
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_repository": {
        const parsed = GetRepositorySchema.parse(args);
        const url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}`;
        const repo = await makeRequest(url);
        
        return {
          content: [
            {
              type: "text",
              text: `Repository: ${repo.full_name}\n` +
                    `Description: ${repo.description || "No description"}\n` +
                    `Language: ${repo.language || "Not specified"}\n` +
                    `Size: ${repo.size || 0} bytes\n` +
                    `Created: ${repo.created_on}\n` +
                    `Updated: ${repo.updated_on}\n` +
                    `Private: ${repo.is_private}\n` +
                    `Fork: ${repo.parent ? "Yes" : "No"}\n` +
                    `Forks: ${repo.forks_count || 0}\n` +
                    `Watchers: ${repo.watchers_count || 0}\n` +
                    `Clone URL (HTTPS): ${repo.links?.clone?.find((link: any) => link.name === "https")?.href}\n` +
                    `Website: ${repo.website || "None"}`,
            },
          ],
        };
      }

      case "list_repositories": {
        const parsed = ListRepositoriesSchema.parse(args);
        const params = new URLSearchParams();
        if (parsed.page) params.append("page", parsed.page.toString());
        if (parsed.pagelen) params.append("pagelen", Math.min(parsed.pagelen, 100).toString());
        
        const url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}?${params}`;
        const data = await makeRequest(url);
        
        const repoList = data.values.map((repo: any) => 
          `- ${repo.name} (${repo.full_name})\n` +
          `  Description: ${repo.description || "No description"}\n` +
          `  Language: ${repo.language || "Not specified"}\n` +
          `  Private: ${repo.is_private}\n` +
          `  Updated: ${repo.updated_on}`
        ).join("\n\n");
        
        return {
          content: [
            {
              type: "text",
              text: `Repositories in ${parsed.workspace}:\n\n${repoList}\n\n` +
                    `Page: ${data.page}/${Math.ceil(data.size / (parsed.pagelen || 10))}\n` +
                    `Total: ${data.size} repositories`,
            },
          ],
        };
      }

      case "get_pull_requests": {
        const parsed = GetPullRequestsSchema.parse(args);
        const params = new URLSearchParams();
        if (parsed.state) params.append("state", parsed.state);
        if (parsed.page) params.append("page", parsed.page.toString());
        if (parsed.pagelen) params.append("pagelen", Math.min(parsed.pagelen, 100).toString());
        
        const url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}/pullrequests?${params}`;
        const data = await makeRequest(url);
        
        const prList = data.values.map((pr: any) => 
          `- #${pr.id}: ${pr.title}\n` +
          `  Author: ${pr.author.display_name}\n` +
          `  State: ${pr.state}\n` +
          `  Source: ${pr.source.branch.name} → ${pr.destination.branch.name}\n` +
          `  Created: ${pr.created_on}\n` +
          `  Updated: ${pr.updated_on}`
        ).join("\n\n");
        
        return {
          content: [
            {
              type: "text",
              text: `Pull Requests for ${parsed.workspace}/${parsed.repo_slug}:\n\n${prList}\n\n` +
                    `Page: ${data.page}\n` +
                    `Total: ${data.size} pull requests`,
            },
          ],
        };
      }

      case "get_pull_request": {
        const parsed = GetPullRequestSchema.parse(args);
        const url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}/pullrequests/${parsed.pull_request_id}`;
        const pr = await makeRequest(url);
        
        return {
          content: [
            {
              type: "text",
              text: `Pull Request #${pr.id}: ${pr.title}\n\n` +
                    `Author: ${pr.author.display_name}\n` +
                    `State: ${pr.state}\n` +
                    `Source: ${pr.source.branch.name} → ${pr.destination.branch.name}\n` +
                    `Created: ${pr.created_on}\n` +
                    `Updated: ${pr.updated_on}\n` +
                    `Reviewers: ${pr.reviewers?.map((r: any) => r.display_name).join(", ") || "None"}\n\n` +
                    `Description:\n${pr.description || "No description"}`,
            },
          ],
        };
      }

      case "get_issues": {
        const parsed = GetIssuesSchema.parse(args);
        const params = new URLSearchParams();
        if (parsed.state) params.append("state", parsed.state);
        if (parsed.kind) params.append("kind", parsed.kind);
        if (parsed.page) params.append("page", parsed.page.toString());
        if (parsed.pagelen) params.append("pagelen", Math.min(parsed.pagelen, 100).toString());
        
        const url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}/issues?${params}`;
        const data = await makeRequest(url);
        
        const issueList = data.values.map((issue: any) => 
          `- #${issue.id}: ${issue.title}\n` +
          `  Reporter: ${issue.reporter.display_name}\n` +
          `  State: ${issue.state}\n` +
          `  Kind: ${issue.kind}\n` +
          `  Priority: ${issue.priority}\n` +
          `  Created: ${issue.created_on}\n` +
          `  Updated: ${issue.updated_on}`
        ).join("\n\n");
        
        return {
          content: [
            {
              type: "text",
              text: `Issues for ${parsed.workspace}/${parsed.repo_slug}:\n\n${issueList}\n\n` +
                    `Page: ${data.page}\n` +
                    `Total: ${data.size} issues`,
            },
          ],
        };
      }

      case "get_issue": {
        const parsed = GetIssueSchema.parse(args);
        const url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}/issues/${parsed.issue_id}`;
        const issue = await makeRequest(url);
        
        return {
          content: [
            {
              type: "text",
              text: `Issue #${issue.id}: ${issue.title}\n\n` +
                    `Reporter: ${issue.reporter.display_name}\n` +
                    `Assignee: ${issue.assignee?.display_name || "Unassigned"}\n` +
                    `State: ${issue.state}\n` +
                    `Kind: ${issue.kind}\n` +
                    `Priority: ${issue.priority}\n` +
                    `Created: ${issue.created_on}\n` +
                    `Updated: ${issue.updated_on}\n\n` +
                    `Description:\n${issue.content?.raw || "No description"}`,
            },
          ],
        };
      }

      case "get_commits": {
        const parsed = GetCommitsSchema.parse(args);
        const params = new URLSearchParams();
        if (parsed.page) params.append("page", parsed.page.toString());
        if (parsed.pagelen) params.append("pagelen", Math.min(parsed.pagelen, 100).toString());
        
        let url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}/commits`;
        if (parsed.branch) {
          url += `/${parsed.branch}`;
        }
        url += `?${params}`;
        
        const data = await makeRequest(url);
        
        const commitList = data.values.map((commit: any) => 
          `- ${commit.hash.substring(0, 8)}: ${commit.message.split('\n')[0]}\n` +
          `  Author: ${commit.author.user?.display_name || commit.author.raw}\n` +
          `  Date: ${commit.date}`
        ).join("\n\n");
        
        return {
          content: [
            {
              type: "text",
              text: `Commits for ${parsed.workspace}/${parsed.repo_slug}${parsed.branch ? ` (${parsed.branch})` : ""}:\n\n${commitList}\n\n` +
                    `Page: ${data.page}\n` +
                    `Total: ${data.size} commits`,
            },
          ],
        };
      }

      case "get_branches": {
        const parsed = GetBranchesSchema.parse(args);
        const params = new URLSearchParams();
        if (parsed.page) params.append("page", parsed.page.toString());
        if (parsed.pagelen) params.append("pagelen", Math.min(parsed.pagelen, 100).toString());
        
        const url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}/refs/branches?${params}`;
        const data = await makeRequest(url);
        
        const branchList = data.values.map((branch: any) => 
          `- ${branch.name}\n` +
          `  Target: ${branch.target.hash.substring(0, 8)}\n` +
          `  Date: ${branch.target.date}`
        ).join("\n\n");
        
        return {
          content: [
            {
              type: "text",
              text: `Branches for ${parsed.workspace}/${parsed.repo_slug}:\n\n${branchList}\n\n` +
                    `Page: ${data.page}\n` +
                    `Total: ${data.size} branches`,
            },
          ],
        };
      }

      case "get_file_content": {
        const parsed = GetFileContentSchema.parse(args);
        let url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}/src`;
        if (parsed.ref) {
          url += `/${parsed.ref}`;
        }
        url += `/${parsed.file_path}`;
        
        const response = await fetch(url, {
          headers: {
            "Accept": "text/plain",
            "User-Agent": "bitbucket-mcp-server/1.0.0",
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        const content = await response.text();
        
        return {
          content: [
            {
              type: "text",
              text: `File: ${parsed.file_path}\n` +
                    `Repository: ${parsed.workspace}/${parsed.repo_slug}\n` +
                    `Reference: ${parsed.ref || "default branch"}\n\n` +
                    `Content:\n\`\`\`\n${content}\n\`\`\``,
            },
          ],
        };
      }

      case "search_code": {
        const parsed = SearchCodeSchema.parse(args);
        const params = new URLSearchParams();
        params.append("search_query", parsed.search_query);
        if (parsed.page) params.append("page", parsed.page.toString());
        if (parsed.pagelen) params.append("pagelen", Math.min(parsed.pagelen, 100).toString());
        
        const url = `${BITBUCKET_API_BASE}/repositories/${parsed.workspace}/${parsed.repo_slug}/search/code?${params}`;
        const data = await makeRequest(url);
        
        const resultList = data.values.map((result: any) => 
          `- File: ${result.file.path}\n` +
          `  Line: ${result.line_number}\n` +
          `  Content: ${result.content_match_text}`
        ).join("\n\n");
        
        return {
          content: [
            {
              type: "text",
              text: `Code search results for "${parsed.search_query}" in ${parsed.workspace}/${parsed.repo_slug}:\n\n${resultList}\n\n` +
                    `Page: ${data.page}\n` +
                    `Total: ${data.size} results`,
            },
          ],
        };
      }

      case "get_user": {
        const parsed = GetUserSchema.parse(args);
        const url = `${BITBUCKET_API_BASE}/users/${parsed.username}`;
        const user = await makeRequest(url);
        
        return {
          content: [
            {
              type: "text",
              text: `User: ${user.display_name} (@${user.username})\n` +
                    `Account ID: ${user.account_id}\n` +
                    `Type: ${user.type}\n` +
                    `Website: ${user.website || "None"}\n` +
                    `Location: ${user.location || "Not specified"}\n` +
                    `Created: ${user.created_on}`,
            },
          ],
        };
      }

      case "get_workspace": {
        const parsed = GetWorkspaceSchema.parse(args);
        const url = `${BITBUCKET_API_BASE}/workspaces/${parsed.workspace}`;
        const workspace = await makeRequest(url);
        
        return {
          content: [
            {
              type: "text",
              text: `Workspace: ${workspace.name}\n` +
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
          type: "text",
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
  console.error("Bitbucket MCP Server running on stdio");
  console.error("Note: Set BITBUCKET_USERNAME and BITBUCKET_APP_PASSWORD environment variables for authenticated requests");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
