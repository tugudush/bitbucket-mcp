/**
 * Tests for repository handler functions
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  handleGetRepository,
  handleListRepositories,
  handleGetBranches,
  handleGetCommits,
  handleBrowseRepository,
  handleGetFileContent,
  handleGetTags,
  handleGetTag,
  handleGetBranch,
} from '../../handlers/repository.js';

// Mock the API module
jest.mock('../../api.js', () => ({
  makeRequest: jest.fn(),
  makeTextRequest: jest.fn(),
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

import { makeRequest, makeTextRequest } from '../../api.js';

const mockMakeRequest = makeRequest as jest.MockedFunction<typeof makeRequest>;
const mockMakeTextRequest = makeTextRequest as jest.MockedFunction<
  typeof makeTextRequest
>;

describe('Repository Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleGetRepository', () => {
    it('should fetch and format repository details', async () => {
      const mockRepo = {
        full_name: 'workspace/repo',
        description: 'Test repo',
        language: 'TypeScript',
        is_private: false,
        created_on: '2024-01-01T00:00:00Z',
        updated_on: '2024-02-01T00:00:00Z',
        size: 1024,
        forks_count: 5,
        watchers_count: 10,
        website: 'https://example.com',
      };

      mockMakeRequest.mockResolvedValueOnce(mockRepo);

      const result = await handleGetRepository({
        workspace: 'workspace',
        repo_slug: 'repo',
      });

      expect(result.content[0].text).toContain('Repository: workspace/repo');
      expect(result.content[0].text).toContain('Description: Test repo');
      expect(result.content[0].text).toContain('Language: TypeScript');
      expect(result.content[0].text).toContain('Private: false');
      expect(result.isError).toBeFalsy();
    });

    it('should handle missing optional fields', async () => {
      const mockRepo = {
        full_name: 'workspace/repo',
        description: null,
        language: null,
        is_private: true,
        created_on: '2024-01-01T00:00:00Z',
        updated_on: '2024-02-01T00:00:00Z',
        size: null,
        forks_count: null,
        watchers_count: null,
        website: null,
      };

      mockMakeRequest.mockResolvedValueOnce(mockRepo);

      const result = await handleGetRepository({
        workspace: 'workspace',
        repo_slug: 'repo',
      });

      expect(result.content[0].text).toContain('Description: No description');
      expect(result.content[0].text).toContain('Language: Not specified');
      expect(result.content[0].text).toContain('Website: None');
    });

    it('should reject invalid input', async () => {
      await expect(
        handleGetRepository({ workspace: 'test' })
      ).rejects.toThrow();
    });
  });

  describe('handleListRepositories', () => {
    it('should list repositories with pagination', async () => {
      const mockResponse = {
        values: [
          {
            full_name: 'workspace/repo1',
            description: 'Repo 1',
            is_private: false,
          },
          {
            full_name: 'workspace/repo2',
            description: 'Repo 2',
            is_private: true,
          },
        ],
        size: 2,
        page: 1,
        next: 'https://api.bitbucket.org/2.0/repositories/workspace?page=2',
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleListRepositories({
        workspace: 'workspace',
        pagelen: 10,
      });

      expect(result.content[0].text).toContain('workspace/repo1');
      expect(result.content[0].text).toContain('workspace/repo2');
      expect(result.content[0].text).toContain('Repositories in workspace');
      expect(result.isError).toBeFalsy();
    });
  });

  describe('handleGetBranches', () => {
    it('should list branches with truncated hashes', async () => {
      const mockResponse = {
        values: [
          { name: 'main', target: { hash: 'abcdef1234567890' } },
          { name: 'develop', target: { hash: '1234567890abcdef' } },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetBranches({
        workspace: 'workspace',
        repo_slug: 'repo',
      });

      expect(result.content[0].text).toContain('main');
      expect(result.content[0].text).toContain('abcdef1');
      expect(result.content[0].text).toContain('develop');
    });
  });

  describe('handleGetCommits', () => {
    it('should list commits with pagination', async () => {
      const mockResponse = {
        values: [
          {
            hash: 'abc123',
            message: 'Initial commit',
            author: { user: { display_name: 'John' } },
            date: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetCommits({
        workspace: 'workspace',
        repo_slug: 'repo',
      });

      expect(result.content[0].text).toContain('abc123');
      expect(result.content[0].text).toContain('Initial commit');
      expect(result.content[0].text).toContain('John');
    });
  });

  describe('handleBrowseRepository', () => {
    it('should browse root directory', async () => {
      const mockResponse = {
        values: [
          { type: 'commit_directory', path: 'src' },
          { type: 'commit_file', path: 'README.md' },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleBrowseRepository({
        workspace: 'workspace',
        repo_slug: 'repo',
        ref: 'main',
      });

      expect(result.content[0].text).toContain('📁 src');
      expect(result.content[0].text).toContain('📄 README.md');
    });

    it('should browse subdirectory by resolving ref to commit SHA', async () => {
      const mockCommitResponse = { hash: 'abc123' };
      const mockDirResponse = {
        values: [{ type: 'commit_file', path: 'src/index.ts' }],
      };

      mockMakeRequest
        .mockResolvedValueOnce(mockCommitResponse)
        .mockResolvedValueOnce(mockDirResponse);

      const result = await handleBrowseRepository({
        workspace: 'workspace',
        repo_slug: 'repo',
        ref: 'feature/test',
        path: 'src',
      });

      expect(result.content[0].text).toContain('📄 src/index.ts');
    });

    it('should apply item limit', async () => {
      const mockResponse = {
        values: Array.from({ length: 150 }, (_, i) => ({
          type: 'commit_file',
          path: `file${i}.txt`,
        })),
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleBrowseRepository({
        workspace: 'workspace',
        repo_slug: 'repo',
        ref: 'main',
        limit: 50,
      });

      const itemCount = (result.content[0].text.match(/📄/g) || []).length;
      expect(itemCount).toBe(50);
      expect(result.content[0].text).toContain('50 of 150');
    });
  });

  describe('handleGetFileContent', () => {
    it('should fetch file content with line numbers', async () => {
      const mockFileContent = 'line 1\nline 2\nline 3\nline 4\nline 5';

      mockMakeTextRequest.mockResolvedValueOnce(mockFileContent);

      const result = await handleGetFileContent({
        workspace: 'workspace',
        repo_slug: 'repo',
        file_path: 'README.md',
        ref: 'main',
      });

      expect(result.content[0].text).toContain('1: line 1');
      expect(result.content[0].text).toContain('2: line 2');
      expect(result.content[0].text).toContain('5: line 5');
    });

    it('should handle line-based pagination', async () => {
      const mockFileContent = Array.from(
        { length: 100 },
        (_, i) => `line ${i + 1}`
      ).join('\n');

      mockMakeTextRequest.mockResolvedValueOnce(mockFileContent);

      const result = await handleGetFileContent({
        workspace: 'workspace',
        repo_slug: 'repo',
        file_path: 'large.txt',
        ref: 'main',
        start: 10,
        limit: 5,
      });

      expect(result.content[0].text).toContain('10: line 10');
      expect(result.content[0].text).toContain('14: line 14');
      expect(result.content[0].text).not.toContain('15: line 15');
      expect(result.content[0].text).toContain('lines 10-14');
    });

    it('should resolve HEAD to commit SHA', async () => {
      const mockCommitResponse = { hash: 'abc123' };
      const mockFileContent = 'content';

      mockMakeRequest.mockResolvedValueOnce(mockCommitResponse);
      mockMakeTextRequest.mockResolvedValueOnce(mockFileContent);

      const result = await handleGetFileContent({
        workspace: 'workspace',
        repo_slug: 'repo',
        file_path: 'file.txt',
        ref: 'HEAD',
      });

      expect(result.isError).toBeFalsy();
    });
  });

  describe('handleGetTags', () => {
    it('should list tags with empty check', async () => {
      const mockResponse = {
        values: [
          { name: 'v1.0.0', target: { hash: 'abc123' } },
          { name: 'v1.1.0', target: { hash: 'def456' } },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetTags({
        workspace: 'workspace',
        repo_slug: 'repo',
      });

      expect(result.content[0].text).toContain('v1.0.0');
      expect(result.content[0].text).toContain('v1.1.0');
    });

    it('should handle empty tags', async () => {
      const mockResponse = { values: [] };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetTags({
        workspace: 'workspace',
        repo_slug: 'repo',
      });

      expect(result.content[0].text).toContain('No tags');
    });
  });

  describe('handleGetTag', () => {
    it('should fetch tag details', async () => {
      const mockTag = {
        name: 'v1.0.0',
        target: { hash: 'abc123', date: '2024-01-01T00:00:00Z' },
        tagger: { user: { display_name: 'Tagger' } },
      };

      mockMakeRequest.mockResolvedValueOnce(mockTag);

      const result = await handleGetTag({
        workspace: 'workspace',
        repo_slug: 'repo',
        name: 'v1.0.0',
      });

      expect(result.content[0].text).toContain('v1.0.0');
      expect(result.content[0].text).toContain('abc123');
    });
  });

  describe('handleGetBranch', () => {
    it('should fetch branch details', async () => {
      const mockBranch = {
        name: 'develop',
        target: {
          hash: 'abc123',
          date: '2024-01-01T00:00:00Z',
          author: { user: { display_name: 'Author' } },
        },
      };

      mockMakeRequest.mockResolvedValueOnce(mockBranch);

      const result = await handleGetBranch({
        workspace: 'workspace',
        repo_slug: 'repo',
        name: 'develop',
      });

      expect(result.content[0].text).toContain('develop');
      expect(result.content[0].text).toContain('abc123');
    });

    it('should handle branches with special characters', async () => {
      const mockBranch = {
        name: 'feature/test-123',
        target: { hash: 'abc123' },
      };

      mockMakeRequest.mockResolvedValueOnce(mockBranch);

      const result = await handleGetBranch({
        workspace: 'workspace',
        repo_slug: 'repo',
        name: 'feature/test-123',
      });

      expect(result.content[0].text).toContain('feature/test-123');
    });
  });
});
