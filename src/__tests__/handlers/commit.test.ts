/**
 * Tests for commit handler functions
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  handleGetCommit,
  handleGetCommitStatuses,
  handleGetMergeBase,
  handleGetFileHistory,
} from '../../handlers/commit.js';

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

describe('Commit Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleGetCommit', () => {
    it('should fetch commit details with parents', async () => {
      const mockCommit = {
        hash: 'abc123',
        message: 'Test commit',
        author: {
          user: { display_name: 'Alice' },
          raw: 'Alice <alice@example.com>',
        },
        date: '2024-01-01T00:00:00Z',
        parents: [{ hash: 'parent1' }, { hash: 'parent2' }],
      };

      mockMakeRequest.mockResolvedValueOnce(mockCommit);

      const result = await handleGetCommit({
        workspace: 'workspace',
        repo_slug: 'repo',
        commit: 'abc123',
      });

      expect(result.content[0].text).toContain('abc123');
      expect(result.content[0].text).toContain('Test commit');
      expect(result.content[0].text).toContain('Alice');
      expect(result.content[0].text).toContain('parent1, parent2');
      expect(result.isError).toBeFalsy();
    });

    it('should handle commit without parents', async () => {
      const mockCommit = {
        hash: 'abc123',
        message: 'Initial commit',
        author: { user: { display_name: 'Alice' } },
        date: '2024-01-01T00:00:00Z',
        parents: [],
      };

      mockMakeRequest.mockResolvedValueOnce(mockCommit);

      const result = await handleGetCommit({
        workspace: 'workspace',
        repo_slug: 'repo',
        commit: 'abc123',
      });

      expect(result.content[0].text).toContain('Parents:');
    });
  });

  describe('handleGetCommitStatuses', () => {
    it('should list commit statuses with icons', async () => {
      const mockResponse = {
        values: [
          {
            key: 'build',
            name: 'Build',
            state: 'SUCCESSFUL',
            description: 'Build passed',
            url: 'https://example.com',
          },
          {
            key: 'test',
            name: 'Tests',
            state: 'FAILED',
            description: 'Tests failed',
          },
          {
            key: 'deploy',
            name: 'Deploy',
            state: 'INPROGRESS',
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetCommitStatuses({
        workspace: 'workspace',
        repo_slug: 'repo',
        commit: 'abc123',
      });

      expect(result.content[0].text).toContain('✅ Build');
      expect(result.content[0].text).toContain('Build passed');
      expect(result.content[0].text).toContain('❌ Tests');
      expect(result.content[0].text).toContain('🔄 Deploy');
    });

    it('should handle empty statuses', async () => {
      const mockResponse = { values: [] };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetCommitStatuses({
        workspace: 'workspace',
        repo_slug: 'repo',
        commit: 'abc123',
      });

      expect(result.content[0].text).toContain('No build statuses');
    });
  });

  describe('handleGetMergeBase', () => {
    it('should find merge base with optional fields', async () => {
      const mockCommit = {
        hash: 'merge123',
        message: 'Merge base commit',
        author: {
          user: { display_name: 'Alice' },
          raw: 'Alice <alice@example.com>',
        },
        date: '2024-01-01T00:00:00Z',
        parents: [{ hash: 'parent1' }],
      };

      mockMakeRequest.mockResolvedValueOnce(mockCommit);

      const result = await handleGetMergeBase({
        workspace: 'workspace',
        repo_slug: 'repo',
        revspec: 'main..feature',
      });

      expect(result.content[0].text).toContain('merge123');
      expect(result.content[0].text).toContain('Merge base commit');
      expect(result.content[0].text).toContain('Alice');
    });

    it('should handle missing optional author fields', async () => {
      const mockCommit = {
        hash: 'merge123',
        message: 'Merge base commit',
        date: '2024-01-01T00:00:00Z',
      };

      mockMakeRequest.mockResolvedValueOnce(mockCommit);

      const result = await handleGetMergeBase({
        workspace: 'workspace',
        repo_slug: 'repo',
        revspec: 'main..feature',
      });

      expect(result.content[0].text).not.toContain('Author:');
    });
  });

  describe('handleGetFileHistory', () => {
    it('should list file history with pagination', async () => {
      const mockResponse = {
        values: [
          {
            hash: 'abc123',
            commit: {
              hash: 'abc123',
              message: 'Update file',
              author: { user: { display_name: 'Alice' } },
              date: '2024-01-01T00:00:00Z',
            },
          },
          {
            hash: 'def456',
            commit: {
              hash: 'def456',
              message: 'Create file',
              author: { user: { display_name: 'Bob' } },
              date: '2024-01-02T00:00:00Z',
            },
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetFileHistory({
        workspace: 'workspace',
        repo_slug: 'repo',
        commit: 'main',
        path: 'src/file.ts',
      });

      expect(result.content[0].text).toContain('abc123');
      expect(result.content[0].text).toContain('Update file');
      expect(result.content[0].text).toContain('Alice');
      expect(result.content[0].text).toContain('def456');
      expect(result.isError).toBeFalsy();
    });

    it('should handle empty history', async () => {
      const mockResponse = { values: [] };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetFileHistory({
        workspace: 'workspace',
        repo_slug: 'repo',
        commit: 'main',
        path: 'new-file.ts',
      });

      expect(result.content[0].text).toContain('No history found');
    });

    it('should handle path encoding', async () => {
      const mockResponse = {
        values: [
          {
            hash: 'abc123',
            commit: {
              hash: 'abc123',
              message: 'Update',
              author: { user: { display_name: 'Alice' } },
              date: '2024-01-01T00:00:00Z',
            },
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      await handleGetFileHistory({
        workspace: 'workspace',
        repo_slug: 'repo',
        commit: 'main',
        path: 'src/path with spaces/file.ts',
      });

      // Verify request was made (path encoding happens internally)
      expect(mockMakeRequest).toHaveBeenCalled();
    });
  });
});
