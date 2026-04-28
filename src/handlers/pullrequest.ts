/**
 * Pull request-related tool handlers
 */

import {
  GetPullRequestsSchema,
  GetPullRequestSchema,
  GetPullRequestCommentsSchema,
  GetPullRequestCommentSchema,
  GetCommentThreadSchema,
  GetPullRequestActivitySchema,
  GetPullRequestCommitsSchema,
  GetPullRequestStatusesSchema,
  GetContextSchema,
} from '../schemas.js';
import {
  makeRequest,
  buildApiUrl,
  addQueryParams,
  fetchAllPages,
} from '../api.js';
import type {
  BitbucketApiResponse,
  BitbucketPullRequest,
  BitbucketComment,
  BitbucketActivity,
  BitbucketCommit,
  BitbucketCommitStatus,
  DiffstatResponse,
} from '../types.js';
import { createResponse, createDataResponse, ToolResponse } from './types.js';

/**
 * Get pull requests for a repository
 */
export async function handleGetPullRequests(
  args: unknown
): Promise<ToolResponse> {
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

  return createDataResponse(
    `Pull requests for ${parsed.workspace}/${parsed.repo_slug} (${data.size} total):\n\n${prList}`,
    data
  );
}

/**
 * Get detailed information about a specific pull request
 */
export async function handleGetPullRequest(
  args: unknown
): Promise<ToolResponse> {
  const parsed = GetPullRequestSchema.parse(args);
  const url = buildApiUrl(
    `/repositories/${parsed.workspace}/${parsed.repo_slug}/pullrequests/${parsed.pull_request_id}`
  );
  const data = await makeRequest<BitbucketPullRequest>(url);

  return createDataResponse(
    `Pull Request #${data.id}: ${data.title}\n` +
      `Author: ${data.author.display_name}\n` +
      `State: ${data.state}\n` +
      `Created: ${data.created_on}\n` +
      `Updated: ${data.updated_on}\n` +
      `Source: ${data.source.branch.name} → ${data.destination.branch.name}\n` +
      `Description:\n${data.description || 'No description'}\n` +
      `Reviewers: ${data.reviewers?.map(r => r.display_name).join(', ') || 'None'}`,
    data
  );
}

/**
 * Get comments for a specific pull request
 */
export async function handleGetPullRequestComments(
  args: unknown
): Promise<ToolResponse> {
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
  const data = await makeRequest<BitbucketApiResponse<BitbucketComment>>(url);

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

  return createDataResponse(
    `Comments for PR #${parsed.pull_request_id} (${data.size} total):\n\n${commentList}`,
    data
  );
}

/**
 * Get a single comment by ID from a pull request
 */
export async function handleGetPullRequestComment(
  args: unknown
): Promise<ToolResponse> {
  const parsed = GetPullRequestCommentSchema.parse(args);
  const url = buildApiUrl(
    `/repositories/${parsed.workspace}/${parsed.repo_slug}/pullrequests/${parsed.pull_request_id}/comments/${parsed.comment_id}`
  );
  const comment = await makeRequest<BitbucketComment>(url);

  let response =
    `Comment #${comment.id} on PR #${parsed.pull_request_id}:\n\n` +
    `Author: ${comment.user.display_name}\n` +
    `Created: ${comment.created_on}\n`;

  if (comment.updated_on && comment.updated_on !== comment.created_on) {
    response += `Updated: ${comment.updated_on}\n`;
  }

  if (comment.inline) {
    response += `\nInline Comment:\n`;
    response += `  File: ${comment.inline.path}\n`;
    if (comment.inline.to) response += `  Line: ${comment.inline.to}\n`;
    if (comment.inline.from && comment.inline.from !== comment.inline.to) {
      response += `  From Line: ${comment.inline.from}\n`;
    }
  }

  if (comment.parent) {
    response += `\nReply to Comment #${comment.parent.id}\n`;
  }

  response += `\nContent:\n${comment.content?.raw || 'No content'}`;

  if (comment.deleted) {
    response += `\n\n[This comment has been deleted]`;
  }

  return createDataResponse(response, comment);
}

/**
 * Get a comment thread (root comment + all replies)
 */
export async function handleGetCommentThread(
  args: unknown
): Promise<ToolResponse> {
  const parsed = GetCommentThreadSchema.parse(args);

  // First, get the root comment
  const rootUrl = buildApiUrl(
    `/repositories/${parsed.workspace}/${parsed.repo_slug}/pullrequests/${parsed.pull_request_id}/comments/${parsed.comment_id}`
  );
  const rootComment = await makeRequest<BitbucketComment>(rootUrl);

  // Then get all comments to find replies (fetch all pages to avoid missing replies)
  const allCommentsUrl = addQueryParams(
    buildApiUrl(
      `/repositories/${parsed.workspace}/${parsed.repo_slug}/pullrequests/${parsed.pull_request_id}/comments`
    ),
    { pagelen: 100 }
  );
  const allCommentsList = await fetchAllPages<BitbucketComment>(allCommentsUrl);

  // Build the thread by finding all replies (direct and nested)
  const findReplies = (
    parentId: number,
    depth: number = 0
  ): BitbucketComment[] => {
    const directReplies = allCommentsList.filter(
      c => c.parent?.id === parentId
    );
    const allReplies: BitbucketComment[] = [];
    for (const reply of directReplies) {
      allReplies.push(reply);
      // Recursively find nested replies
      allReplies.push(...findReplies(reply.id, depth + 1));
    }
    return allReplies;
  };

  // Calculate depth by walking up parent chain
  const calculateDepth = (
    comment: BitbucketComment,
    allComments: BitbucketComment[]
  ): number => {
    let depth = 1; // Start at 1 for direct replies to root
    let current = comment;
    while (current.parent && current.parent.id !== parsed.comment_id) {
      const parent = allComments.find(c => c.id === current.parent?.id);
      if (!parent) break;
      current = parent;
      depth++;
    }
    return depth;
  };

  const replies = findReplies(parsed.comment_id);

  // Format the root comment with optional indentation based on depth
  const formatComment = (comment: BitbucketComment, depth: number = 0) => {
    const indent = '  '.repeat(depth);
    let text =
      `${indent}📝 Comment #${comment.id}\n` +
      `${indent}Author: ${comment.user.display_name}\n` +
      `${indent}Created: ${comment.created_on}\n`;

    if (comment.inline) {
      text += `${indent}File: ${comment.inline.path}`;
      if (comment.inline.to) text += `, Line: ${comment.inline.to}`;
      text += '\n';
    }

    text += `${indent}Content:\n${indent}${comment.content?.raw || 'No content'}\n`;

    if (comment.deleted) {
      text += `${indent}[This comment has been deleted]\n`;
    }

    return text;
  };

  let response = `Comment Thread for #${parsed.comment_id} on PR #${parsed.pull_request_id}:\n\n`;
  response += `=== ROOT COMMENT ===\n`;
  response += formatComment(rootComment, 0);

  if (replies.length > 0) {
    response += `\n=== REPLIES (${replies.length}) ===\n`;
    for (const reply of replies) {
      // Calculate depth of this reply to show nesting visually
      const replyDepth = calculateDepth(reply, allCommentsList);
      response += `\n` + formatComment(reply, replyDepth);
    }
  } else {
    response += `\nNo replies to this comment.`;
  }

  return createDataResponse(response, { root: rootComment, replies });
}

/**
 * Get activity for a specific pull request
 */
export async function handleGetPullRequestActivity(
  args: unknown
): Promise<ToolResponse> {
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
  const data = await makeRequest<BitbucketApiResponse<BitbucketActivity>>(url);

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
        const updateAuthor = activity.update.author?.display_name || 'Unknown';
        activityText += `\n  Update: ${activity.update.state || 'Updated'} by ${updateAuthor}`;
        if (activity.update.title) {
          activityText += `\n  Title changed to: ${activity.update.title}`;
        }
      }

      return activityText;
    })
    .join('\n\n');

  return createDataResponse(
    `Activity for PR #${parsed.pull_request_id} (${data.size} total):\n\n${activityList}`,
    data
  );
}

/**
 * List commits that belong to a pull request
 */
export async function handleGetPullRequestCommits(
  args: unknown
): Promise<ToolResponse> {
  const parsed = GetPullRequestCommitsSchema.parse(args);
  const params = {
    page: parsed.page,
    pagelen: parsed.pagelen,
  };
  const url = addQueryParams(
    buildApiUrl(
      `/repositories/${parsed.workspace}/${parsed.repo_slug}/pullrequests/${parsed.pull_request_id}/commits`
    ),
    params
  );
  const data = await makeRequest<BitbucketApiResponse<BitbucketCommit>>(url);

  if (!data.values || data.values.length === 0) {
    return createResponse(
      `No commits found for PR #${parsed.pull_request_id}.`
    );
  }

  const commitList = data.values
    .map(
      (commit: BitbucketCommit) =>
        `- ${commit.hash.substring(0, 8)}: ${commit.message.split('\n')[0]}\n` +
        `  Author: ${commit.author.user?.display_name || commit.author.raw}\n` +
        `  Date: ${commit.date}`
    )
    .join('\n\n');

  return createDataResponse(
    `Commits for PR #${parsed.pull_request_id} in ${parsed.workspace}/${parsed.repo_slug} (${data.values.length} commits):\n\n${commitList}`,
    data
  );
}

/**
 * Get CI/CD build statuses for a pull request
 */
export async function handleGetPullRequestStatuses(
  args: unknown
): Promise<ToolResponse> {
  const parsed = GetPullRequestStatusesSchema.parse(args);
  const params = {
    page: parsed.page,
    pagelen: parsed.pagelen,
  };
  const url = addQueryParams(
    buildApiUrl(
      `/repositories/${parsed.workspace}/${parsed.repo_slug}/pullrequests/${parsed.pull_request_id}/statuses`
    ),
    params
  );
  const data =
    await makeRequest<BitbucketApiResponse<BitbucketCommitStatus>>(url);

  if (!data.values || data.values.length === 0) {
    return createResponse(
      `No build statuses found for PR #${parsed.pull_request_id}.`
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
    `Build statuses for PR #${parsed.pull_request_id} (${data.values.length} total):\n\n${statusList}`,
    data
  );
}

/**
 * Parse a Bitbucket PR URL into workspace, repo_slug, and pull_request_id.
 * Supports: https://bitbucket.org/{workspace}/{repo}/pull-requests/{id}
 */
function parseBitbucketPrUrl(
  url: string
): { workspace: string; repo_slug: string; pull_request_id: number } | null {
  try {
    const parsed = new URL(url);
    // Normalize hostname — accept bitbucket.org and www.bitbucket.org
    if (
      parsed.hostname !== 'bitbucket.org' &&
      parsed.hostname !== 'www.bitbucket.org'
    ) {
      return null;
    }
    // Path: /{workspace}/{repo}/pull-requests/{id}
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length >= 4 && parts[2] === 'pull-requests') {
      const prId = parseInt(parts[3], 10);
      if (!isNaN(prId)) {
        return {
          workspace: parts[0],
          repo_slug: parts[1],
          pull_request_id: prId,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get a curated bundle of PR context in a single call.
 *
 * Returns: PR metadata, diffstat summary, build/review status, and comment previews.
 * Supports direct params, branch-based PR lookup, and Bitbucket URL parsing.
 */
export async function handleGetContext(args: unknown): Promise<ToolResponse> {
  const parsed = GetContextSchema.parse(args);

  // --- Resolve workspace, repo_slug, pull_request_id ---
  let workspace: string;
  let repo_slug: string;
  let pull_request_id: number;

  if (parsed.url) {
    const urlParts = parseBitbucketPrUrl(parsed.url);
    if (!urlParts) {
      return createResponse(
        `Error: Could not parse Bitbucket PR URL: ${parsed.url}\n` +
          `Expected format: https://bitbucket.org/{workspace}/{repo}/pull-requests/{id}`
      );
    }
    workspace = urlParts.workspace;
    repo_slug = urlParts.repo_slug;
    pull_request_id = urlParts.pull_request_id;
  } else if (parsed.workspace && parsed.repo_slug) {
    workspace = parsed.workspace;
    repo_slug = parsed.repo_slug;

    if (parsed.pull_request_id) {
      pull_request_id = parsed.pull_request_id;
    } else if (parsed.branch) {
      // Look up the open PR for this branch
      const searchUrl = addQueryParams(
        buildApiUrl(`/repositories/${workspace}/${repo_slug}/pullrequests`),
        {
          q: `source.branch.name="${parsed.branch}" AND state="OPEN"`,
          pagelen: 1,
        }
      );
      const searchResult =
        await makeRequest<BitbucketApiResponse<BitbucketPullRequest>>(
          searchUrl
        );
      if (!searchResult.values || searchResult.values.length === 0) {
        return createResponse(
          `No open pull request found for branch "${parsed.branch}" in ${workspace}/${repo_slug}.`
        );
      }
      pull_request_id = searchResult.values[0].id;
    } else {
      return createResponse(
        'Error: Either pull_request_id or branch must be provided (or use url).'
      );
    }
  } else {
    return createResponse(
      'Error: Either url, or both workspace and repo_slug, must be provided.'
    );
  }

  const detail = parsed.detail_level || 'summary';
  const baseUrl = `/repositories/${workspace}/${repo_slug}/pullrequests/${pull_request_id}`;

  // --- Fetch PR details ---
  const pr = await makeRequest<BitbucketPullRequest>(buildApiUrl(baseUrl));

  // --- Fetch diffstat, statuses, and comments in parallel ---
  const [diffstatData, statusData, commentData] = await Promise.all([
    // Diffstat
    makeRequest<DiffstatResponse>(buildApiUrl(`${baseUrl}/diffstat`)).catch(
      () => null
    ),
    // Build statuses
    makeRequest<BitbucketApiResponse<BitbucketCommitStatus>>(
      buildApiUrl(`${baseUrl}/statuses`)
    ).catch(() => null),
    // Comments (first page)
    makeRequest<BitbucketApiResponse<BitbucketComment>>(
      addQueryParams(buildApiUrl(`${baseUrl}/comments`), {
        pagelen: detail === 'full' ? 20 : 3,
      })
    ).catch(() => null),
  ]);

  // --- Build response ---
  const lines: string[] = [];

  // PR metadata
  lines.push(`=== PR #${pr.id}: ${pr.title} ===`);
  lines.push(`State: ${pr.state}`);
  lines.push(`Author: ${pr.author.display_name}`);
  lines.push(
    `Branch: ${pr.source.branch.name} → ${pr.destination.branch.name}`
  );
  lines.push(`Created: ${pr.created_on}`);
  lines.push(`Updated: ${pr.updated_on}`);

  if (pr.reviewers && pr.reviewers.length > 0) {
    lines.push(
      `Reviewers: ${pr.reviewers.map(r => r.display_name).join(', ')}`
    );
  }

  // PR description (full mode only)
  if (detail === 'full' && pr.description) {
    lines.push('');
    lines.push('--- Description ---');
    lines.push(pr.description);
  }

  // Diffstat summary
  lines.push('');
  lines.push('--- Diffstat ---');
  if (diffstatData && diffstatData.values && diffstatData.values.length > 0) {
    const totalAdded = diffstatData.values.reduce(
      (sum, e) => sum + e.lines_added,
      0
    );
    const totalRemoved = diffstatData.values.reduce(
      (sum, e) => sum + e.lines_removed,
      0
    );
    lines.push(
      `${diffstatData.values.length} file(s) changed, +${totalAdded} -${totalRemoved}`
    );

    if (detail === 'full') {
      for (const entry of diffstatData.values) {
        const status = entry.status.toUpperCase();
        const filePath = entry.new?.path || entry.old?.path || '(unknown)';
        if (entry.status === 'renamed') {
          lines.push(
            `  ${status}: ${entry.old?.path} → ${entry.new?.path}  (+${entry.lines_added} -${entry.lines_removed})`
          );
        } else {
          lines.push(
            `  ${status}: ${filePath}  (+${entry.lines_added} -${entry.lines_removed})`
          );
        }
      }
    }
  } else {
    lines.push('No diffstat available.');
  }

  // Build statuses
  lines.push('');
  lines.push('--- Build Status ---');
  if (statusData && statusData.values && statusData.values.length > 0) {
    for (const s of statusData.values) {
      const icon =
        s.state === 'SUCCESSFUL'
          ? '✅'
          : s.state === 'FAILED'
            ? '❌'
            : s.state === 'INPROGRESS'
              ? '🔄'
              : '❓';
      lines.push(
        `${icon} ${s.name}: ${s.state}${s.description ? ` — ${s.description}` : ''}`
      );
    }
  } else {
    lines.push('No build statuses found.');
  }

  // Comments
  lines.push('');
  lines.push('--- Comments ---');
  if (commentData && commentData.values && commentData.values.length > 0) {
    const total = commentData.size || commentData.values.length;
    lines.push(
      `${total} comment(s) total. Showing latest ${commentData.values.length}:\n`
    );
    for (const comment of commentData.values) {
      const preview = (comment.content?.raw || 'No content')
        .split('\n')
        .slice(0, 3)
        .join('\n  ');
      const inline = comment.inline
        ? ` [${comment.inline.path}:${comment.inline.to || comment.inline.from}]`
        : '';
      lines.push(
        `• ${comment.user.display_name} (${comment.created_on})${inline}:\n  ${preview}`
      );
    }
  } else {
    lines.push('No comments.');
  }

  // Build structured data for JSON/TOON output
  const contextData = {
    pull_request: {
      id: pr.id,
      title: pr.title,
      state: pr.state,
      author: pr.author.display_name,
      source_branch: pr.source.branch.name,
      destination_branch: pr.destination.branch.name,
      created_on: pr.created_on,
      updated_on: pr.updated_on,
      reviewers: pr.reviewers?.map(r => r.display_name) || [],
      ...(detail === 'full' ? { description: pr.description } : {}),
    },
    diffstat: diffstatData
      ? {
          files_changed: diffstatData.values?.length || 0,
          lines_added:
            diffstatData.values?.reduce((s, e) => s + e.lines_added, 0) || 0,
          lines_removed:
            diffstatData.values?.reduce((s, e) => s + e.lines_removed, 0) || 0,
          ...(detail === 'full'
            ? {
                files: diffstatData.values?.map(e => ({
                  path: e.new?.path || e.old?.path,
                  status: e.status,
                  lines_added: e.lines_added,
                  lines_removed: e.lines_removed,
                })),
              }
            : {}),
        }
      : null,
    build_statuses:
      statusData?.values?.map(s => ({
        name: s.name,
        state: s.state,
        description: s.description,
      })) || [],
    comments: {
      total: commentData?.size || 0,
      showing: commentData?.values?.length || 0,
      items:
        commentData?.values?.map(c => ({
          id: c.id,
          author: c.user.display_name,
          created_on: c.created_on,
          content: c.content?.raw,
          inline: c.inline || null,
        })) || [],
    },
  };

  return createDataResponse(lines.join('\n'), contextData);
}
