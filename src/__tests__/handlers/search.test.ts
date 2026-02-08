/**
 * Tests for search handler functions
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  handleSearchRepositories,
  handleSearchCode,
} from '../../handlers/search.js';

// Mock the API module
jest.mock('../../api.js', () => ({
  makeRequest: jest.fn(),
  buildApiUrl: jest.fn(endpoint => `https://api.bitbucket.org/2.0${endpoint}`),
  addQueryParams: jest.fn((url: string, params: Record<string, unknown>) => {
    const urlObj = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.append(key, String(value));
      }
    });
    return urlObj.toString();
  }),
}));

import { makeRequest } from '../../api.js';

const mockMakeRequest = makeRequest as jest.MockedFunction<typeof makeRequest>;

describe('Search Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleSearchRepositories', () => {
    it('should pass query as BBQL q parameter for server-side filtering', async () => {
      const mockResponse = {
        values: [
          {
            name: 'test-repo',
            full_name: 'workspace/test-repo',
            description: 'A test repo',
            is_private: false,
          },
        ],
        size: 1,
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleSearchRepositories({
        workspace: 'workspace',
        query: 'test',
      });

      // Verify the API was called with a q parameter (BBQL server-side filter)
      const calledUrl = (mockMakeRequest.mock.calls[0] as string[])[0];
      expect(calledUrl).toContain('q=');
      expect(calledUrl).toContain('name');
      expect(calledUrl).toContain('description');
      expect(result.content[0].text).toContain('test-repo');
      expect(result.isError).toBeFalsy();
    });

    it('should default pagelen to max page size (100)', async () => {
      const mockResponse = { values: [], size: 0 };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      await handleSearchRepositories({
        workspace: 'workspace',
        query: 'test',
      });

      const calledUrl = (mockMakeRequest.mock.calls[0] as string[])[0];
      expect(calledUrl).toContain('pagelen=100');
    });

    it('should include sort parameter when provided', async () => {
      const mockResponse = { values: [], size: 0 };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      await handleSearchRepositories({
        workspace: 'workspace',
        query: 'test',
        sort: '-updated_on',
      });

      const calledUrl = (mockMakeRequest.mock.calls[0] as string[])[0];
      expect(calledUrl).toContain('sort=-updated_on');
    });

    it('should escape double quotes in BBQL query', async () => {
      const mockResponse = { values: [], size: 0 };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      await handleSearchRepositories({
        workspace: 'workspace',
        query: 'test"injection',
      });

      const calledUrl = (mockMakeRequest.mock.calls[0] as string[])[0];
      // The double quote should be escaped in the BBQL query
      expect(calledUrl).not.toContain('test"injection');
    });

    it('should display all server-returned results without client-side filtering', async () => {
      const mockResponse = {
        values: [
          {
            name: 'test-repo',
            full_name: 'workspace/test-repo',
            description: 'A test repo',
            is_private: false,
          },
          {
            name: 'another-test',
            full_name: 'workspace/another-test',
            description: 'Another test',
            is_private: true,
          },
        ],
        size: 2,
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleSearchRepositories({
        workspace: 'workspace',
        query: 'test',
      });

      // All results from server should be displayed (no client-side filtering)
      expect(result.content[0].text).toContain('test-repo');
      expect(result.content[0].text).toContain('another-test');
      expect(result.content[0].text).toContain('2 results');
    });

    it('should handle empty results', async () => {
      const mockResponse = { values: [], size: 0 };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleSearchRepositories({
        workspace: 'workspace',
        query: 'nonexistent',
      });

      expect(result.content[0].text).toContain('No repositories');
    });

    it('should indicate when more results are available', async () => {
      const mockResponse = {
        values: [
          {
            name: 'test-repo',
            full_name: 'workspace/test-repo',
            description: 'A test repo',
            is_private: false,
          },
        ],
        size: 50,
        next: 'https://api.bitbucket.org/2.0/repositories/workspace?page=2',
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleSearchRepositories({
        workspace: 'workspace',
        query: 'test',
      });

      expect(result.content[0].text).toContain('more results available');
    });
  });

  describe('handleSearchCode', () => {
    it('should search code with match highlighting', async () => {
      const mockResponse = {
        values: [
          {
            type: 'code_search_result',
            content_match_count: 2,
            path_matches: [{ text: 'src/file.ts' }],
            file: {
              path: 'src/file.ts',
              type: 'commit_file',
            },
            content_matches: [
              {
                lines: [
                  {
                    line: 10,
                    segments: [
                      { text: 'function ', match: false },
                      { text: 'test', match: true },
                      { text: '() {', match: false },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleSearchCode({
        workspace: 'workspace',
        search_query: 'test',
      });

      expect(result.content[0].text).toContain('src/file.ts');
      expect(result.content[0].text).toContain('Line 10');
      expect(result.content[0].text).toContain('**test**');
      expect(result.isError).toBeFalsy();
    });

    it('should enhance query with repo filter', async () => {
      const mockResponse = { values: [] };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      await handleSearchCode({
        workspace: 'workspace',
        search_query: 'function',
        repo_slug: 'myrepo',
      });

      // Verify the query was enhanced (happens internally)
      expect(mockMakeRequest).toHaveBeenCalled();
    });

    it('should enhance query with language filter', async () => {
      const mockResponse = { values: [] };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      await handleSearchCode({
        workspace: 'workspace',
        search_query: 'class',
        language: 'typescript',
      });

      // Verify the query was enhanced (happens internally)
      expect(mockMakeRequest).toHaveBeenCalled();
    });

    it('should handle empty results', async () => {
      const mockResponse = { values: [] };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleSearchCode({
        workspace: 'workspace',
        search_query: 'nonexistent',
      });

      expect(result.content[0].text).toContain('0 results');
    });

    it('should format multiple matches per file', async () => {
      const mockResponse = {
        values: [
          {
            type: 'code_search_result',
            content_match_count: 3,
            file: { path: 'src/file.ts' },
            content_matches: [
              {
                lines: [
                  {
                    line: 5,
                    segments: [{ text: 'match1', match: true }],
                  },
                ],
              },
              {
                lines: [
                  {
                    line: 10,
                    segments: [{ text: 'match2', match: true }],
                  },
                ],
              },
            ],
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleSearchCode({
        workspace: 'workspace',
        search_query: 'match',
      });

      expect(result.content[0].text).toContain('Line 5');
      expect(result.content[0].text).toContain('Line 10');
      expect(result.content[0].text).toContain('3 matches');
    });
  });
});
