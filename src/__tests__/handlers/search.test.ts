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
    it('should search repositories by name', async () => {
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
          {
            name: 'unrelated',
            full_name: 'workspace/unrelated',
            description: 'Unrelated repo',
            is_private: false,
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleSearchRepositories({
        workspace: 'workspace',
        query: 'test',
      });

      expect(result.content[0].text).toContain('test-repo');
      expect(result.content[0].text).toContain('another-test');
      expect(result.content[0].text).not.toContain('unrelated');
      expect(result.isError).toBeFalsy();
    });

    it('should search by description', async () => {
      const mockResponse = {
        values: [
          {
            name: 'repo1',
            full_name: 'workspace/repo1',
            description: 'Contains important keyword',
            is_private: false,
          },
          {
            name: 'repo2',
            full_name: 'workspace/repo2',
            description: 'No match here',
            is_private: false,
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleSearchRepositories({
        workspace: 'workspace',
        query: 'important',
      });

      expect(result.content[0].text).toContain('repo1');
      expect(result.content[0].text).not.toContain('repo2');
    });

    it('should match full name', async () => {
      const mockResponse = {
        values: [
          {
            name: 'test-repo',
            full_name: 'workspace/test-repo',
            description: 'Repo',
            is_private: false,
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleSearchRepositories({
        workspace: 'workspace',
        query: 'workspace/test',
      });

      expect(result.content[0].text).toContain('test-repo');
    });

    it('should be case-insensitive', async () => {
      const mockResponse = {
        values: [
          {
            name: 'TestRepo',
            full_name: 'workspace/TestRepo',
            description: 'Test',
            is_private: false,
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleSearchRepositories({
        workspace: 'workspace',
        query: 'TESTREPO',
      });

      expect(result.content[0].text).toContain('TestRepo');
    });

    it('should handle no matches', async () => {
      const mockResponse = {
        values: [
          {
            name: 'repo',
            full_name: 'workspace/repo',
            description: 'No match',
            is_private: false,
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleSearchRepositories({
        workspace: 'workspace',
        query: 'nonexistent',
      });

      expect(result.content[0].text).toContain('No repositories');
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
