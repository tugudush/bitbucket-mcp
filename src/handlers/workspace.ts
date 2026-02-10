/**
 * Workspace and user-related tool handlers
 */

import {
  ListWorkspacesSchema,
  GetWorkspaceSchema,
  GetUserSchema,
  GetCurrentUserSchema,
} from '../schemas.js';
import { makeRequest, buildApiUrl, addQueryParams } from '../api.js';
import type {
  BitbucketApiResponse,
  BitbucketWorkspace,
  BitbucketUser,
} from '../types.js';
import { createDataResponse, ToolResponse } from './types.js';

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

  return createDataResponse(
    `Accessible workspaces (${data.size} total):\n\n${workspaceList}`,
    data
  );
}

/**
 * Get information about a workspace
 */
export async function handleGetWorkspace(args: unknown): Promise<ToolResponse> {
  const parsed = GetWorkspaceSchema.parse(args);
  const url = buildApiUrl(`/workspaces/${parsed.workspace}`);
  const data = await makeRequest<BitbucketWorkspace>(url);

  return createDataResponse(
    `Workspace: ${data.name} (${data.slug})\n` +
      `Type: ${data.type}\n` +
      `UUID: ${data.uuid || 'Not available'}\n` +
      `Created: ${data.created_on || 'Unknown'}`,
    data
  );
}

/**
 * Get information about a user
 */
export async function handleGetUser(args: unknown): Promise<ToolResponse> {
  const parsed = GetUserSchema.parse(args);

  // Use /users/{selected_user} when a username/UUID is provided,
  // otherwise fall back to /user (current authenticated user)
  const url = parsed.selected_user
    ? buildApiUrl(`/users/${encodeURIComponent(parsed.selected_user)}`)
    : buildApiUrl('/user');
  const data = await makeRequest<BitbucketUser>(url);

  return createDataResponse(
    `User: ${data.display_name}${data.username ? ` (@${data.username})` : ''}\n` +
      `UUID: ${data.uuid || 'Not available'}\n` +
      `Account ID: ${data.account_id || 'Not available'}\n` +
      `Type: ${data.type}\n` +
      `Website: ${data.website || 'None'}\n` +
      `Location: ${data.location || 'Not specified'}\n` +
      `Created: ${data.created_on || 'Not available'}`,
    data
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

  return createDataResponse(
    `Current User: ${data.display_name}${data.username ? ` (@${data.username})` : ''}\n` +
      `Account ID: ${data.account_id || 'Not available'}\n` +
      `Type: ${data.type}\n` +
      `Website: ${data.website || 'None'}\n` +
      `Location: ${data.location || 'Not specified'}\n` +
      `Created: ${data.created_on || 'Not available'}`,
    data
  );
}
