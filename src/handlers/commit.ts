/**
 * Commit-related tool handlers
 *
 * Implements:
 * - bb_get_commit — Get detailed commit info
 * - bb_get_commit_statuses — CI/CD build statuses for a commit
 * - bb_get_merge_base — Common ancestor between two refs
 * - bb_get_file_history — Commits that modified a file
 */

import {
  GetCommitSchema,
  GetCommitStatusesSchema,
  GetMergeBaseSchema,
  GetFileHistorySchema,
} from '../schemas.js';
import { makeRequest, buildApiUrl, addQueryParams } from '../api.js';
import type {
  BitbucketApiResponse,
  BitbucketCommitDetailed,
  BitbucketCommitStatus,
  BitbucketMergeBase,
  BitbucketFileHistoryEntry,
} from '../types.js';
import { createResponse, createDataResponse, ToolResponse } from './types.js';

/**
 * Get detailed information about a specific commit
 */
export async function handleGetCommit(args: unknown): Promise<ToolResponse> {
  const parsed = GetCommitSchema.parse(args);
  const url = buildApiUrl(
    `/repositories/${parsed.workspace}/${parsed.repo_slug}/commit/${encodeURIComponent(parsed.commit)}`
  );
  const data = await makeRequest<BitbucketCommitDetailed>(url);

  const parents = data.parents
    ? data.parents.map(p => p.hash.substring(0, 8)).join(', ')
    : 'None';

  return createDataResponse(
    `Commit: ${data.hash}\n` +
      `Message: ${data.message.trim()}\n` +
      `Author: ${data.author.user?.display_name || data.author.raw}\n` +
      `Date: ${data.date}\n` +
      `Parents: ${parents}\n` +
      `Repository: ${data.repository?.full_name || `${parsed.workspace}/${parsed.repo_slug}`}`,
    data
  );
}

/**
 * Get CI/CD build statuses for a specific commit
 */
export async function handleGetCommitStatuses(
  args: unknown
): Promise<ToolResponse> {
  const parsed = GetCommitStatusesSchema.parse(args);
  const params = {
    page: parsed.page,
    pagelen: parsed.pagelen,
  };
  const url = addQueryParams(
    buildApiUrl(
      `/repositories/${parsed.workspace}/${parsed.repo_slug}/commit/${encodeURIComponent(parsed.commit)}/statuses`
    ),
    params
  );
  const data =
    await makeRequest<BitbucketApiResponse<BitbucketCommitStatus>>(url);

  if (!data.values || data.values.length === 0) {
    return createResponse(
      `No build statuses found for commit ${parsed.commit.substring(0, 8)}.`
    );
  }

  const statusIcon = (state: string) => {
    switch (state) {
      case 'SUCCESSFUL':
        return '✅';
      case 'FAILED':
        return '❌';
      case 'INPROGRESS':
        return '🔄';
      case 'STOPPED':
        return '⏹️';
      default:
        return '❓';
    }
  };

  const statusList = data.values
    .map(
      (s: BitbucketCommitStatus) =>
        `${statusIcon(s.state)} ${s.name}\n` +
        `  State: ${s.state}\n` +
        `  Key: ${s.key}\n` +
        (s.description ? `  Description: ${s.description}\n` : '') +
        (s.url ? `  URL: ${s.url}\n` : '') +
        `  Updated: ${s.updated_on || s.created_on}`
    )
    .join('\n\n');

  return createDataResponse(
    `Build statuses for commit ${parsed.commit.substring(0, 8)} (${data.values.length} total):\n\n${statusList}`,
    data
  );
}

/**
 * Get the common ancestor (merge-base) between two commits or branches
 */
export async function handleGetMergeBase(args: unknown): Promise<ToolResponse> {
  const parsed = GetMergeBaseSchema.parse(args);
  const url = buildApiUrl(
    `/repositories/${parsed.workspace}/${parsed.repo_slug}/merge-base/${parsed.revspec}`
  );
  const data = await makeRequest<BitbucketMergeBase>(url);

  return createDataResponse(
    `Merge base for ${parsed.revspec}:\n` +
      `Commit: ${data.hash}\n` +
      (data.message ? `Message: ${data.message.trim()}\n` : '') +
      (data.date ? `Date: ${data.date}\n` : '') +
      (data.author
        ? `Author: ${data.author.user?.display_name || data.author.raw}\n`
        : ''),
    data
  );
}

/**
 * Get the commit history for a specific file
 */
export async function handleGetFileHistory(
  args: unknown
): Promise<ToolResponse> {
  const parsed = GetFileHistorySchema.parse(args);
  const params = {
    page: parsed.page,
    pagelen: parsed.pagelen,
  };
  const encodedPath = parsed.path
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
  const url = addQueryParams(
    buildApiUrl(
      `/repositories/${parsed.workspace}/${parsed.repo_slug}/filehistory/${encodeURIComponent(parsed.commit)}/${encodedPath}`
    ),
    params
  );
  const data =
    await makeRequest<BitbucketApiResponse<BitbucketFileHistoryEntry>>(url);

  if (!data.values || data.values.length === 0) {
    return createResponse(
      `No history found for file ${parsed.path} at ${parsed.commit}.`
    );
  }

  const historyList = data.values
    .map((entry: BitbucketFileHistoryEntry) => {
      const message = entry.commit.message
        ? entry.commit.message.split('\n')[0]
        : '(no message)';
      const author = entry.commit.author
        ? entry.commit.author.user?.display_name || entry.commit.author.raw
        : 'Unknown';
      return (
        `- ${entry.commit.hash.substring(0, 8)}: ${message}\n` +
        `  Author: ${author}\n` +
        `  Date: ${entry.commit.date}` +
        (entry.size !== undefined ? `\n  File size: ${entry.size} bytes` : '')
      );
    })
    .join('\n\n');

  return createDataResponse(
    `File history for ${parsed.path} (from ${parsed.commit}):\n` +
      `${data.values.length} commits found:\n\n${historyList}`,
    data
  );
}
