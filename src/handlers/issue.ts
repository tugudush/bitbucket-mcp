/**
 * Issue-related tool handlers
 */

import { GetIssuesSchema, GetIssueSchema } from '../schemas.js';
import { makeRequest, buildApiUrl, addQueryParams } from '../api.js';
import type { BitbucketApiResponse, BitbucketIssue } from '../types.js';
import { createResponse, ToolResponse } from './types.js';

/**
 * Get issues for a repository
 */
export async function handleGetIssues(args: unknown): Promise<ToolResponse> {
  const parsed = GetIssuesSchema.parse(args);
  const params = {
    state: parsed.state,
    kind: parsed.kind,
    page: parsed.page,
    pagelen: parsed.pagelen,
  };
  const url = addQueryParams(
    buildApiUrl(`/repositories/${parsed.workspace}/${parsed.repo_slug}/issues`),
    params
  );
  const data = await makeRequest<BitbucketApiResponse<BitbucketIssue>>(url);

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

  return createResponse(
    `Issues for ${parsed.workspace}/${parsed.repo_slug} (${data.size} total):\n\n${issueList}`
  );
}

/**
 * Get detailed information about a specific issue
 */
export async function handleGetIssue(args: unknown): Promise<ToolResponse> {
  const parsed = GetIssueSchema.parse(args);
  const url = buildApiUrl(
    `/repositories/${parsed.workspace}/${parsed.repo_slug}/issues/${parsed.issue_id}`
  );
  const data = await makeRequest<BitbucketIssue>(url);

  return createResponse(
    `Issue #${data.id}: ${data.title}\n` +
      `State: ${data.state}\n` +
      `Kind: ${data.kind}\n` +
      `Priority: ${data.priority}\n` +
      `Reporter: ${data.reporter.display_name}\n` +
      `Assignee: ${data.assignee?.display_name || 'Unassigned'}\n` +
      `Created: ${data.created_on}\n` +
      `Updated: ${data.updated_on}\n` +
      `Content:\n${data.content?.raw || 'No content'}`
  );
}
