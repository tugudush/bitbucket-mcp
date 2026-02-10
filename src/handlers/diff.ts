/**
 * Diff-related tool handlers
 *
 * Implements:
 * - bb_get_pull_request_diff — raw unified diff for a PR
 * - bb_get_pull_request_diffstat — per-file change summary for a PR
 * - bb_get_diff — raw diff between commits
 * - bb_get_diffstat — per-file change summary between commits
 */

import {
  GetPullRequestDiffSchema,
  GetPullRequestDiffstatSchema,
  GetDiffSchema,
  GetDiffstatSchema,
} from '../schemas.js';
import {
  makeRequest,
  makeTextRequest,
  buildApiUrl,
  addQueryParams,
} from '../api.js';
import type { DiffstatResponse, DiffstatEntry } from '../types.js';
import { createResponse, createDataResponse, ToolResponse } from './types.js';

/**
 * Format a diffstat entry into a readable line
 */
function formatDiffstatEntry(entry: DiffstatEntry): string {
  const status = entry.status.toUpperCase();
  const added = entry.lines_added;
  const removed = entry.lines_removed;
  const oldPath = entry.old?.path || '(none)';
  const newPath = entry.new?.path || '(none)';

  if (entry.status === 'renamed') {
    return `  ${status}: ${oldPath} → ${newPath}  (+${added} -${removed})`;
  }
  const filePath = entry.new?.path || entry.old?.path || '(unknown)';
  return `  ${status}: ${filePath}  (+${added} -${removed})`;
}

/**
 * Get the raw unified diff for a pull request
 */
export async function handleGetPullRequestDiff(
  args: unknown
): Promise<ToolResponse> {
  const parsed = GetPullRequestDiffSchema.parse(args);
  const params: Record<string, unknown> = {};
  if (parsed.context !== undefined) params.context = parsed.context;
  if (parsed.path) params.path = parsed.path;

  const url = addQueryParams(
    buildApiUrl(
      `/repositories/${parsed.workspace}/${parsed.repo_slug}/pullrequests/${parsed.pull_request_id}/diff`
    ),
    params
  );

  const diff = await makeTextRequest(url);

  if (!diff || diff.trim().length === 0) {
    return createResponse(
      `No changes found in pull request #${parsed.pull_request_id}.`
    );
  }

  return createDataResponse(
    `Diff for PR #${parsed.pull_request_id} in ${parsed.workspace}/${parsed.repo_slug}:\n\n${diff}`,
    { diff }
  );
}

/**
 * Get the diffstat for a pull request (per-file change summary)
 */
export async function handleGetPullRequestDiffstat(
  args: unknown
): Promise<ToolResponse> {
  const parsed = GetPullRequestDiffstatSchema.parse(args);
  const params: Record<string, unknown> = {};
  if (parsed.path) params.path = parsed.path;

  const url = addQueryParams(
    buildApiUrl(
      `/repositories/${parsed.workspace}/${parsed.repo_slug}/pullrequests/${parsed.pull_request_id}/diffstat`
    ),
    params
  );

  const data = await makeRequest<DiffstatResponse>(url);

  if (!data.values || data.values.length === 0) {
    return createResponse(
      `No changes found in pull request #${parsed.pull_request_id}.`
    );
  }

  const totalAdded = data.values.reduce((sum, e) => sum + e.lines_added, 0);
  const totalRemoved = data.values.reduce((sum, e) => sum + e.lines_removed, 0);

  const fileList = data.values.map(formatDiffstatEntry).join('\n');

  return createDataResponse(
    `Diffstat for PR #${parsed.pull_request_id} in ${parsed.workspace}/${parsed.repo_slug}:\n` +
      `${data.values.length} file(s) changed, +${totalAdded} -${totalRemoved}\n\n` +
      fileList,
    data
  );
}

/**
 * Get the raw unified diff between commits
 */
export async function handleGetDiff(args: unknown): Promise<ToolResponse> {
  const parsed = GetDiffSchema.parse(args);
  const params: Record<string, unknown> = {};
  if (parsed.context !== undefined) params.context = parsed.context;
  if (parsed.path) params.path = parsed.path;
  if (parsed.ignore_whitespace)
    params.ignore_whitespace = parsed.ignore_whitespace;
  if (parsed.topic) params.topic = parsed.topic;

  const url = addQueryParams(
    buildApiUrl(
      `/repositories/${parsed.workspace}/${parsed.repo_slug}/diff/${parsed.spec}`
    ),
    params
  );

  const diff = await makeTextRequest(url);

  if (!diff || diff.trim().length === 0) {
    return createResponse(`No changes found for spec: ${parsed.spec}`);
  }

  return createDataResponse(
    `Diff for ${parsed.spec} in ${parsed.workspace}/${parsed.repo_slug}:\n\n${diff}`,
    { diff }
  );
}

/**
 * Get the diffstat (per-file change summary) between commits
 */
export async function handleGetDiffstat(args: unknown): Promise<ToolResponse> {
  const parsed = GetDiffstatSchema.parse(args);
  const params: Record<string, unknown> = {};
  if (parsed.path) params.path = parsed.path;
  if (parsed.ignore_whitespace)
    params.ignore_whitespace = parsed.ignore_whitespace;
  if (parsed.topic) params.topic = parsed.topic;

  const url = addQueryParams(
    buildApiUrl(
      `/repositories/${parsed.workspace}/${parsed.repo_slug}/diffstat/${parsed.spec}`
    ),
    params
  );

  const data = await makeRequest<DiffstatResponse>(url);

  if (!data.values || data.values.length === 0) {
    return createResponse(`No changes found for spec: ${parsed.spec}`);
  }

  const totalAdded = data.values.reduce((sum, e) => sum + e.lines_added, 0);
  const totalRemoved = data.values.reduce((sum, e) => sum + e.lines_removed, 0);

  const fileList = data.values.map(formatDiffstatEntry).join('\n');

  return createDataResponse(
    `Diffstat for ${parsed.spec} in ${parsed.workspace}/${parsed.repo_slug}:\n` +
      `${data.values.length} file(s) changed, +${totalAdded} -${totalRemoved}\n\n` +
      fileList,
    data
  );
}
