/**
 * Search-related tool handlers
 */

import { SearchRepositoriesSchema, SearchCodeSchema } from '../schemas.js';
import { makeRequest, buildApiUrl, addQueryParams } from '../api.js';
import type {
  BitbucketApiResponse,
  BitbucketRepository,
  CodeSearchResponse,
} from '../types.js';
import { createResponse, ToolResponse } from './types.js';

/**
 * Search for repositories within a workspace
 */
export async function handleSearchRepositories(
  args: unknown
): Promise<ToolResponse> {
  const parsed = SearchRepositoriesSchema.parse(args);

  // Bitbucket API v2.0 doesn't have workspace-scoped repository search
  // Instead, list all repositories in workspace and filter client-side
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

  // Filter repositories based on search query
  const searchLower = parsed.query.toLowerCase();
  const filteredRepos = data.values.filter((repo: BitbucketRepository) => {
    const nameMatch = repo.name.toLowerCase().includes(searchLower);
    const descMatch =
      repo.description?.toLowerCase().includes(searchLower) || false;
    const fullNameMatch = repo.full_name.toLowerCase().includes(searchLower);
    return nameMatch || descMatch || fullNameMatch;
  });

  const repoList = filteredRepos
    .map(
      (repo: BitbucketRepository) =>
        `- ${repo.full_name} (${repo.language || 'Unknown'})\n` +
        `  ${repo.description || 'No description'}\n` +
        `  Private: ${repo.is_private}, Updated: ${repo.updated_on}`
    )
    .join('\n\n');

  return createResponse(
    `Search results for "${parsed.query}" in ${parsed.workspace} (${filteredRepos.length} of ${data.values.length} total):\n\n${repoList || 'No repositories found matching the search query.'}`
  );
}

/**
 * Search for code content within a workspace
 */
export async function handleSearchCode(args: unknown): Promise<ToolResponse> {
  const parsed = SearchCodeSchema.parse(args);
  const params: Record<string, unknown> = {
    search_query: parsed.search_query,
    page: parsed.page,
    pagelen: parsed.pagelen,
  };

  // Build enhanced search query with filters
  let searchQuery = parsed.search_query;
  if (parsed.repo_slug) {
    searchQuery += ` repo:${parsed.repo_slug}`;
  }
  if (parsed.language) {
    searchQuery += ` language:${parsed.language}`;
  }
  if (parsed.extension) {
    searchQuery += ` extension:${parsed.extension}`;
  }
  params.search_query = searchQuery;

  const url = addQueryParams(
    buildApiUrl(`/workspaces/${parsed.workspace}/search/code`),
    params
  );
  const data = await makeRequest<CodeSearchResponse>(url);

  const resultList = data.values
    .map(result => {
      const matchCount = result.content_match_count;
      const filePath = result.file.path;
      const matches = result.content_matches
        .map(match =>
          match.lines
            .map(line => {
              const lineText = line.segments
                .map(seg => (seg.match ? `**${seg.text}**` : seg.text))
                .join('');
              return `    Line ${line.line}: ${lineText}`;
            })
            .join('\n')
        )
        .join('\n');

      return `📄 ${filePath} (${matchCount} matches)\n${matches}`;
    })
    .join('\n\n');

  return createResponse(
    `Code search results for "${parsed.search_query}" in ${parsed.workspace} (${data.values.length} results):\n\n${resultList}`
  );
}
