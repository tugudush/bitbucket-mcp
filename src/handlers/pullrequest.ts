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
} from '../types.js';
import { createResponse, ToolResponse } from './types.js';

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

  return createResponse(
    `Pull requests for ${parsed.workspace}/${parsed.repo_slug} (${data.size} total):\n\n${prList}`
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

  return createResponse(
    `Pull Request #${data.id}: ${data.title}\n` +
      `Author: ${data.author.display_name}\n` +
      `State: ${data.state}\n` +
      `Created: ${data.created_on}\n` +
      `Updated: ${data.updated_on}\n` +
      `Source: ${data.source.branch.name} → ${data.destination.branch.name}\n` +
      `Description:\n${data.description || 'No description'}\n` +
      `Reviewers: ${data.reviewers?.map(r => r.display_name).join(', ') || 'None'}`
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

  return createResponse(
    `Comments for PR #${parsed.pull_request_id} (${data.size} total):\n\n${commentList}`
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

  return createResponse(response);
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

  return createResponse(response);
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

  return createResponse(
    `Activity for PR #${parsed.pull_request_id} (${data.size} total):\n\n${activityList}`
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

  return createResponse(
    `Commits for PR #${parsed.pull_request_id} in ${parsed.workspace}/${parsed.repo_slug} (${data.values.length} commits):\n\n${commitList}`
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

  return createResponse(
    `Build statuses for PR #${parsed.pull_request_id} (${data.values.length} total):\n\n${statusList}`
  );
}
