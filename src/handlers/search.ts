/**
 * Search-related tool handlers
 */

import {
  SearchRepositoriesSchema,
  SearchCodeSchema,
  API_CONSTANTS,
} from '../schemas.js';
import { makeRequest, buildApiUrl, addQueryParams } from '../api.js';
import type {
  BitbucketApiResponse,
  BitbucketRepository,
  CodeSearchResponse,
} from '../types.js';
import { createResponse, ToolResponse } from './types.js';

/**
 * Search for repositories within a workspace using Bitbucket's server-side
 * query filtering (BBQL). The `q` parameter searches by name and description.
 */
export async function handleSearchRepositories(
  args: unknown
): Promise<ToolResponse> {
  const parsed = SearchRepositoriesSchema.parse(args);

  // Escape double quotes in the query to prevent BBQL injection
  const escapedQuery = parsed.query.replace(/"/g, '\\"');

  // Use Bitbucket's native q parameter (BBQL) for server-side filtering
  const q = `name ~ "${escapedQuery}" OR description ~ "${escapedQuery}"`;

  const params: Record<string, unknown> = {
    q,
    page: parsed.page,
    pagelen: parsed.pagelen ?? API_CONSTANTS.MAX_PAGE_SIZE,
  };

  if (parsed.sort) {
    params.sort = parsed.sort;
  }

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

  const totalInfo = data.size != null ? ` of ${data.size} total matches` : '';
  const pageInfo = data.next
    ? ' (more results available — use page parameter)'
    : '';

  return createResponse(
    `Search results for "${parsed.query}" in ${parsed.workspace} (${data.values.length} results${totalInfo}${pageInfo}):\n\n${repoList || 'No repositories found matching the search query.'}`
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
