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
  GetTagsSchema,
  GetTagSchema,
  GetBranchSchema,
  API_CONSTANTS,
} from '../schemas.js';
import {
  makeRequest,
  makeTextRequest,
  buildApiUrl,
  addQueryParams,
} from '../api.js';
import type {
  BitbucketApiResponse,
  BitbucketRepository,
  BitbucketBranchWithTarget,
  BitbucketCommit,
  BitbucketSrcListingResponse,
  BitbucketTag,
  BitbucketBranchDetailed,
} from '../types.js';
import { BitbucketApiError } from '../errors.js';
import { createResponse, createDataResponse, ToolResponse } from './types.js';

/**
 * Return true only for 404 errors — used to continue the resolution chain
 * without swallowing real failures (401, 403, 429, 500, network errors, etc.).
 */
function isNotFound(err: unknown): boolean {
  return err instanceof BitbucketApiError && err.status === 404;
}

/**
 * Resolve a git reference (branch, tag, or commit SHA) to a commit SHA.
 *
 * Lookup order:
 *   1. /refs/branches/{ref}  — handles branch names with or without "/"
 *   2. /refs/tags/{ref}      — handles tag names
 *   3. /commit/{ref}         — handles bare commit SHAs and any other revisions
 *
 * Only 404 responses are suppressed at each step; all other errors are re-thrown
 * so the caller sees auth failures, rate-limit errors, and network problems.
 *
 * @param workspace - The Bitbucket workspace
 * @param repo_slug - The repository slug
 * @param ref - Branch name, tag name, or commit SHA
 * @returns The resolved full commit SHA, or null if the ref was not found via any path
 */
async function resolveRefToCommitSha(
  workspace: string,
  repo_slug: string,
  ref: string
): Promise<string | null> {
  const base = `/repositories/${workspace}/${repo_slug}`;

  // 1. Try branch lookup — this is the only path that reliably handles names containing "/"
  try {
    const branchUrl = buildApiUrl(
      `${base}/refs/branches/${encodeURIComponent(ref)}`
    );
    const branchData = await makeRequest<BitbucketBranchDetailed>(branchUrl);
    const branchHash = branchData?.target?.hash;
    if (branchHash) return branchHash;
  } catch (err) {
    if (!isNotFound(err)) throw err;
  }

  // 2. Try tag lookup
  try {
    const tagUrl = buildApiUrl(`${base}/refs/tags/${encodeURIComponent(ref)}`);
    const tagData = await makeRequest<BitbucketTag>(tagUrl);
    const tagHash = tagData?.target?.hash;
    if (tagHash) return tagHash;
  } catch (err) {
    if (!isNotFound(err)) throw err;
  }

  // 3. Try direct commit endpoint (bare SHAs and other revision forms)
  try {
    const commitUrl = buildApiUrl(`${base}/commit/${encodeURIComponent(ref)}`);
    const commitData = await makeRequest<{ hash: string }>(commitUrl);
    const commitHash = commitData?.hash;
    if (commitHash) return commitHash;
  } catch (err) {
    if (!isNotFound(err)) throw err;
  }

  return null;
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

  return createDataResponse(
    `Repository: ${data.full_name}\n` +
      `Description: ${data.description || 'No description'}\n` +
      `Language: ${data.language || 'Not specified'}\n` +
      `Private: ${data.is_private}\n` +
      `Created: ${data.created_on}\n` +
      `Updated: ${data.updated_on}\n` +
      `Size: ${data.size ? `${data.size} bytes` : 'Unknown'}\n` +
      `Forks: ${data.forks_count || 0}\n` +
      `Watchers: ${data.watchers_count || 0}\n` +
      `Website: ${data.website || 'None'}`,
    data
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

  return createDataResponse(
    `Repositories in ${parsed.workspace} (${data.size} total):\n\n${repoList}`,
    data
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

  return createDataResponse(
    `Branches for ${parsed.workspace}/${parsed.repo_slug} (${data.size} total):\n\n${branchList}`,
    data
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

  return createDataResponse(
    `Commits for ${parsed.workspace}/${parsed.repo_slug}${parsed.branch ? ` (${parsed.branch})` : ''} (${data.size} total):\n\n${commitList}`,
    data
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
    } else if (ref.includes('/')) {
      // Slash-containing refs are known to fail with direct /src/{encodedRef}/... URLs.
      // Resolution already tried branch, tag, and commit endpoints — surface a clear error.
      throw new BitbucketApiError(
        404,
        'Not Found',
        `Could not resolve ref '${ref}' in repository ${parsed.workspace}/${parsed.repo_slug}`,
        `Branch, tag, or commit not found. Use bb_get_branches to list available branches.`
      );
    } else {
      // For non-slash refs, fall back to trying the ref directly as a last resort
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

    return createDataResponse(
      `Repository: ${parsed.workspace}/${parsed.repo_slug}\n` +
        `Path: /${path}\n` +
        `Ref: ${ref}\n` +
        `Items (${items.length} of ${data.size || data.values.length} total):\n\n${itemList}`,
      data
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
  } else if (ref.includes('/')) {
    // Slash-containing refs are known to fail with direct /src/{encodedRef}/... URLs.
    // Resolution already tried branch, tag, and commit endpoints — surface a clear error.
    throw new BitbucketApiError(
      404,
      'Not Found',
      `Could not resolve ref '${ref}' in repository ${parsed.workspace}/${parsed.repo_slug}`,
      `Branch, tag, or commit not found. If you have the PR head commit SHA, pass it as 'ref' instead of the branch name.`
    );
  } else {
    // For non-slash refs, fall back to trying the ref directly as a last resort
    const encodedRef = encodeURIComponent(ref);
    url = buildApiUrl(
      `/repositories/${parsed.workspace}/${parsed.repo_slug}/src/${encodedRef}/${encodedFilePath}`
    );
  }

  // Use makeTextRequest for text content — gains retry, timeout, and error enrichment
  const content = await makeTextRequest(url);

  // Handle pagination
  const lines = content.split('\n');
  const start = parsed.start ? Math.max(1, parsed.start) : 1;
  const limit = parsed.limit
    ? Math.min(parsed.limit, API_CONSTANTS.MAX_FILE_LINES)
    : API_CONSTANTS.DEFAULT_FILE_LINES;
  const endLine = Math.min(start + limit - 1, lines.length);
  const paginatedLines = lines.slice(start - 1, endLine);

  return createDataResponse(
    `File: ${parsed.file_path} (lines ${start}-${endLine} of ${lines.length})\n` +
      `Repository: ${parsed.workspace}/${parsed.repo_slug}\n` +
      `Ref: ${ref}\n\n` +
      paginatedLines
        .map((line, index) => `${start + index}: ${line}`)
        .join('\n'),
    {
      file_path: parsed.file_path,
      ref,
      total_lines: lines.length,
      start,
      end: endLine,
      content,
    }
  );
}

/**
 * List tags for a repository
 */
export async function handleGetTags(args: unknown): Promise<ToolResponse> {
  const parsed = GetTagsSchema.parse(args);
  const params = {
    page: parsed.page,
    pagelen: parsed.pagelen,
  };
  const url = addQueryParams(
    buildApiUrl(
      `/repositories/${parsed.workspace}/${parsed.repo_slug}/refs/tags`
    ),
    params
  );
  const data = await makeRequest<BitbucketApiResponse<BitbucketTag>>(url);

  if (!data.values || data.values.length === 0) {
    return createResponse(
      `No tags found for ${parsed.workspace}/${parsed.repo_slug}.`
    );
  }

  const tagList = data.values
    .map(
      (tag: BitbucketTag) =>
        `- ${tag.name}\n` +
        `  Commit: ${tag.target.hash.substring(0, 8)}\n` +
        `  Date: ${tag.target.date}` +
        (tag.message ? `\n  Message: ${tag.message}` : '')
    )
    .join('\n\n');

  return createDataResponse(
    `Tags for ${parsed.workspace}/${parsed.repo_slug} (${data.size} total):\n\n${tagList}`,
    data
  );
}

/**
 * Get detailed information about a specific tag
 */
export async function handleGetTag(args: unknown): Promise<ToolResponse> {
  const parsed = GetTagSchema.parse(args);
  const url = buildApiUrl(
    `/repositories/${parsed.workspace}/${parsed.repo_slug}/refs/tags/${encodeURIComponent(parsed.name)}`
  );
  const data = await makeRequest<BitbucketTag>(url);

  const author = data.target.author
    ? data.target.author.user?.display_name || data.target.author.raw
    : 'Unknown';

  return createDataResponse(
    `Tag: ${data.name}\n` +
      `Target commit: ${data.target.hash}\n` +
      `Date: ${data.target.date}\n` +
      `Author: ${author}\n` +
      (data.target.message
        ? `Commit message: ${data.target.message.trim()}\n`
        : '') +
      (data.message ? `Tag message: ${data.message.trim()}\n` : ''),
    data
  );
}

/**
 * Get detailed information about a specific branch
 */
export async function handleGetBranch(args: unknown): Promise<ToolResponse> {
  const parsed = GetBranchSchema.parse(args);
  const url = buildApiUrl(
    `/repositories/${parsed.workspace}/${parsed.repo_slug}/refs/branches/${encodeURIComponent(parsed.name)}`
  );
  const data = await makeRequest<BitbucketBranchDetailed>(url);

  const author = data.target.author
    ? data.target.author.user?.display_name || data.target.author.raw
    : 'Unknown';

  return createDataResponse(
    `Branch: ${data.name}\n` +
      `Head commit: ${data.target.hash}\n` +
      `Date: ${data.target.date}\n` +
      `Author: ${author}\n` +
      (data.target.message
        ? `Last message: ${data.target.message.trim().split('\n')[0]}\n`
        : '') +
      (data.merge_strategies
        ? `Merge strategies: ${data.merge_strategies.join(', ')}\n`
        : '') +
      (data.default_merge_strategy
        ? `Default merge strategy: ${data.default_merge_strategy}\n`
        : ''),
    data
  );
}
