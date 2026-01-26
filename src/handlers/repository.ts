/**
 * Repository-related tool handlers
 */

import {
  GetRepositorySchema,
  ListRepositoriesSchema,
  BrowseRepositorySchema,
  GetFileContentSchema,
  GetBranchesSchema,
  GetCommitsSchema,
  API_CONSTANTS,
} from '../schemas.js';
import {
  makeRequest,
  buildApiUrl,
  addQueryParams,
  buildRequestHeaders,
} from '../api.js';
import type {
  BitbucketApiResponse,
  BitbucketRepository,
  BitbucketBranchWithTarget,
  BitbucketCommit,
  BitbucketSrcListingResponse,
} from '../types.js';
import { BitbucketApiError } from '../errors.js';
import { createResponse, ToolResponse } from './types.js';

/**
 * Resolve a git reference (branch, tag, or commit SHA) to a commit SHA.
 * Uses the /commit/{revision} endpoint which handles all ref types uniformly.
 *
 * @param workspace - The Bitbucket workspace
 * @param repo_slug - The repository slug
 * @param ref - Branch name, tag name, or commit SHA
 * @returns The resolved commit SHA, or null if resolution fails
 */
async function resolveRefToCommitSha(
  workspace: string,
  repo_slug: string,
  ref: string
): Promise<string | null> {
  try {
    // The /commit/{revision} endpoint resolves branches, tags, and commit SHAs uniformly
    const commitUrl = buildApiUrl(
      `/repositories/${workspace}/${repo_slug}/commit/${encodeURIComponent(ref)}`
    );
    const commitData = await makeRequest<{ hash: string }>(commitUrl);
    return commitData.hash;
  } catch {
    // If resolution fails, return null to let caller handle fallback
    return null;
  }
}

/**
 * Get detailed information about a specific repository
 */
export async function handleGetRepository(
  args: unknown
): Promise<ToolResponse> {
  const parsed = GetRepositorySchema.parse(args);
  const url = buildApiUrl(
    `/repositories/${parsed.workspace}/${parsed.repo_slug}`
  );
  const data = await makeRequest<BitbucketRepository>(url);

  return createResponse(
    `Repository: ${data.full_name}\n` +
      `Description: ${data.description || 'No description'}\n` +
      `Language: ${data.language || 'Not specified'}\n` +
      `Private: ${data.is_private}\n` +
      `Created: ${data.created_on}\n` +
      `Updated: ${data.updated_on}\n` +
      `Size: ${data.size ? `${data.size} bytes` : 'Unknown'}\n` +
      `Forks: ${data.forks_count || 0}\n` +
      `Watchers: ${data.watchers_count || 0}\n` +
      `Website: ${data.website || 'None'}`
  );
}

/**
 * List repositories in a workspace
 */
export async function handleListRepositories(
  args: unknown
): Promise<ToolResponse> {
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

  return createResponse(
    `Repositories in ${parsed.workspace} (${data.size} total):\n\n${repoList}`
  );
}

/**
 * Get branches for a repository
 */
export async function handleGetBranches(args: unknown): Promise<ToolResponse> {
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
    await makeRequest<BitbucketApiResponse<BitbucketBranchWithTarget>>(url);

  const branchList = data.values
    .map(
      (branch: BitbucketBranchWithTarget) =>
        `- ${branch.name}\n` +
        `  Last commit: ${branch.target.hash.substring(0, 8)}\n` +
        `  Date: ${branch.target.date}`
    )
    .join('\n\n');

  return createResponse(
    `Branches for ${parsed.workspace}/${parsed.repo_slug} (${data.size} total):\n\n${branchList}`
  );
}

/**
 * Get commits for a repository branch
 */
export async function handleGetCommits(args: unknown): Promise<ToolResponse> {
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
  const data = await makeRequest<BitbucketApiResponse<BitbucketCommit>>(url);

  const commitList = data.values
    .map(
      (commit: BitbucketCommit) =>
        `- ${commit.hash.substring(0, 8)}: ${commit.message.split('\n')[0]}\n` +
        `  Author: ${commit.author.user?.display_name || commit.author.raw}\n` +
        `  Date: ${commit.date}`
    )
    .join('\n\n');

  return createResponse(
    `Commits for ${parsed.workspace}/${parsed.repo_slug}${parsed.branch ? ` (${parsed.branch})` : ''} (${data.size} total):\n\n${commitList}`
  );
}

/**
 * Browse files and directories in a repository
 */
export async function handleBrowseRepository(
  args: unknown
): Promise<ToolResponse> {
  const parsed = BrowseRepositorySchema.parse(args);
  let ref = parsed.ref;

  // If no ref specified, fetch repository info to get default branch
  if (!ref) {
    try {
      const repoUrl = buildApiUrl(
        `/repositories/${parsed.workspace}/${parsed.repo_slug}`
      );
      const repoData = await makeRequest<BitbucketRepository>(repoUrl);
      ref = repoData.mainbranch?.name || 'main';
    } catch {
      // Fallback to 'main' if we can't get repository info
      ref = 'main';
    }
  }

  const path = parsed.path || '';
  let url: string;

  if (path) {
    // For subdirectories, we need to get the commit SHA first
    // because the /src/{ref}/{path} pattern doesn't work with refs containing slashes
    // Use resolveRefToCommitSha which handles branches, tags, and commit SHAs uniformly
    const commitSha = await resolveRefToCommitSha(
      parsed.workspace,
      parsed.repo_slug,
      ref
    );

    const encodedPath = path
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');

    if (commitSha) {
      // Use /src/{commit_sha}/{path} pattern for subdirectories
      url = buildApiUrl(
        `/repositories/${parsed.workspace}/${parsed.repo_slug}/src/${commitSha}/${encodedPath}`
      );
    } else {
      // If resolution fails, fall back to trying the ref directly
      const encodedRef = encodeURIComponent(ref);
      url = buildApiUrl(
        `/repositories/${parsed.workspace}/${parsed.repo_slug}/src/${encodedRef}/${encodedPath}`
      );
    }
    // Ensure trailing slash for directory browsing
    if (!url.endsWith('/')) {
      url += '/';
    }
  } else {
    // For root directory, use /src?at={ref} pattern (works with branch names)
    url = buildApiUrl(
      `/repositories/${parsed.workspace}/${parsed.repo_slug}/src`
    );
    // Ensure trailing slash for directory browsing
    if (!url.endsWith('/')) {
      url += '/';
    }
    url += `?at=${encodeURIComponent(ref)}`;
  }

  try {
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

    return createResponse(
      `Repository: ${parsed.workspace}/${parsed.repo_slug}\n` +
        `Path: /${path}\n` +
        `Ref: ${ref}\n` +
        `Items (${items.length} of ${data.size || data.values.length} total):\n\n${itemList}`
    );
  } catch (error) {
    if (error instanceof BitbucketApiError && error.status === 404) {
      // Enhanced error message for branch/commit not found
      throw new BitbucketApiError(
        404,
        'Not Found',
        `Branch, tag, or commit '${ref}' not found in repository ${parsed.workspace}/${parsed.repo_slug}`,
        `Try specifying a different branch with the 'ref' parameter. Common branch names are 'main', 'master', or 'develop'. Use bb_get_branches to list available branches.`
      );
    }
    throw error;
  }
}

/**
 * Get the content of a file from a repository
 */
export async function handleGetFileContent(
  args: unknown
): Promise<ToolResponse> {
  const parsed = GetFileContentSchema.parse(args);
  let ref = parsed.ref || 'HEAD';

  // If no ref specified, fetch repository info to get default branch
  if (ref === 'HEAD') {
    try {
      const repoUrl = buildApiUrl(
        `/repositories/${parsed.workspace}/${parsed.repo_slug}`
      );
      const repoData = await makeRequest<BitbucketRepository>(repoUrl);
      ref = repoData.mainbranch?.name || 'main';
    } catch {
      // Fallback to 'main' if we can't get repository info
      ref = 'main';
    }
  }

  // Use resolveRefToCommitSha which handles branches, tags, and commit SHAs uniformly
  // Get commit SHA first to handle refs with slashes (e.g., feature/branch or v1.0.158 tags)
  const commitSha = await resolveRefToCommitSha(
    parsed.workspace,
    parsed.repo_slug,
    ref
  );

  const encodedFilePath = parsed.file_path
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');

  let url: string;
  if (commitSha) {
    // Use /src/{commit_sha}/{file_path} pattern
    url = buildApiUrl(
      `/repositories/${parsed.workspace}/${parsed.repo_slug}/src/${commitSha}/${encodedFilePath}`
    );
  } else {
    // If resolution fails, fall back to trying the ref directly
    const encodedRef = encodeURIComponent(ref);
    url = buildApiUrl(
      `/repositories/${parsed.workspace}/${parsed.repo_slug}/src/${encodedRef}/${encodedFilePath}`
    );
  }

  // Use a custom request for text content instead of makeRequest which expects JSON
  // Use shared buildRequestHeaders utility for authentication
  const headers = buildRequestHeaders('text/plain');

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

  return createResponse(
    `File: ${parsed.file_path} (lines ${start}-${endLine} of ${lines.length})\n` +
      `Repository: ${parsed.workspace}/${parsed.repo_slug}\n` +
      `Ref: ${ref}\n\n` +
      paginatedLines
        .map((line, index) => `${start + index}: ${line}`)
        .join('\n')
  );
}
