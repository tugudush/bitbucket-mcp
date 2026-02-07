/**
 * Workspace and user-related tool handlers
 */

import {
  ListWorkspacesSchema,
  GetWorkspaceSchema,
  GetUserSchema,
  GetCurrentUserSchema,
  ListUserPullRequestsSchema,
} from '../schemas.js';
import { makeRequest, buildApiUrl, addQueryParams } from '../api.js';
import type {
  BitbucketApiResponse,
  BitbucketWorkspace,
  BitbucketUser,
  BitbucketPullRequest,
} from '../types.js';
import { createResponse, ToolResponse } from './types.js';

/**
 * List all accessible workspaces
 */
export async function handleListWorkspaces(
  args: unknown
): Promise<ToolResponse> {
  const parsed = ListWorkspacesSchema.parse(args);
  const params = {
    page: parsed.page,
    pagelen: parsed.pagelen,
  };
  const url = addQueryParams(buildApiUrl('/workspaces'), params);
  const data = await makeRequest<BitbucketApiResponse<BitbucketWorkspace>>(url);

  const workspaceList = data.values
    .map(
      (workspace: BitbucketWorkspace) =>
        `- ${workspace.slug} (${workspace.name})\n` +
        `  Type: ${workspace.type}\n` +
        `  Created: ${workspace.created_on || 'Unknown'}`
    )
    .join('\n\n');

  return createResponse(
    `Accessible workspaces (${data.size} total):\n\n${workspaceList}`
  );
}

/**
 * Get information about a workspace
 */
export async function handleGetWorkspace(args: unknown): Promise<ToolResponse> {
  const parsed = GetWorkspaceSchema.parse(args);
  const url = buildApiUrl(`/workspaces/${parsed.workspace}`);
  const data = await makeRequest<BitbucketWorkspace>(url);

  return createResponse(
    `Workspace: ${data.name} (${data.slug})\n` +
      `Type: ${data.type}\n` +
      `UUID: ${data.uuid || 'Not available'}\n` +
      `Created: ${data.created_on || 'Unknown'}`
  );
}

/**
 * Get information about a user
 */
export async function handleGetUser(args: unknown): Promise<ToolResponse> {
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

  return createResponse(
    `User: ${data.display_name} (@${data.username})\n` +
      `Account ID: ${data.account_id}\n` +
      `Type: ${data.type}\n` +
      `Website: ${data.website || 'None'}\n` +
      `Location: ${data.location || 'Not specified'}\n` +
      `Created: ${data.created_on}`
  );
}

/**
 * Get information about the currently authenticated user
 */
export async function handleGetCurrentUser(
  _args: unknown
): Promise<ToolResponse> {
  // Validate schema even though no params needed
  GetCurrentUserSchema.parse(_args);

  const url = buildApiUrl('/user');
  const data = await makeRequest<BitbucketUser>(url);

  return createResponse(
    `Current User: ${data.display_name} (@${data.username})\n` +
      `Account ID: ${data.account_id}\n` +
      `Type: ${data.type}\n` +
      `Website: ${data.website || 'None'}\n` +
      `Location: ${data.location || 'Not specified'}\n` +
      `Created: ${data.created_on}`
  );
}

/**
 * List all pull requests where a user is author or reviewer across all repos
 */
export async function handleListUserPullRequests(
  args: unknown
): Promise<ToolResponse> {
  const parsed = ListUserPullRequestsSchema.parse(args);
  const params: Record<string, unknown> = {
    page: parsed.page,
    pagelen: parsed.pagelen,
  };
  if (parsed.state) params.state = parsed.state;

  const url = addQueryParams(
    buildApiUrl(`/pullrequests/${encodeURIComponent(parsed.selected_user)}`),
    params
  );
  const data =
    await makeRequest<BitbucketApiResponse<BitbucketPullRequest>>(url);

  if (!data.values || data.values.length === 0) {
    return createResponse(
      `No pull requests found for user ${parsed.selected_user}${parsed.state ? ` with state ${parsed.state}` : ''}.`
    );
  }

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

  return createResponse(
    `Pull requests for user ${parsed.selected_user}${parsed.state ? ` (${parsed.state})` : ''} (${data.size} total):\n\n${prList}`
  );
}
