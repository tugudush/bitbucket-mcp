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
import { BitbucketApiError } from '../../errors.js';

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
      // Branch lookup returns the commit SHA via target.hash
      const mockBranchResponse = {
        name: 'feature/test',
        target: { hash: 'abc123', date: '2024-01-01' },
      };
      const mockDirResponse = {
        values: [{ type: 'commit_file', path: 'src/index.ts' }],
      };

      mockMakeRequest
        .mockResolvedValueOnce(mockBranchResponse)
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

    it('should fall back to file content when path points at a file (Bitbucket returned text instead of JSON)', async () => {
      // resolveRefToCommitSha: branch lookup (HEAD → mainbranch resolved by caller)
      const mockBranchResponse = {
        name: 'main',
        target: { hash: 'abc123', date: '2024-01-01' },
      };
      // Directory listing attempt throws SyntaxError (Bitbucket returned the file body as text/plain)
      mockMakeRequest
        .mockResolvedValueOnce(mockBranchResponse)
        .mockImplementationOnce(() => {
          throw new SyntaxError('Unexpected token in JSON at position 0');
        });
      // Fallback file content fetch
      const mockFileContent = 'export const hello = "world";';
      mockMakeTextRequest.mockResolvedValueOnce(mockFileContent);

      const result = await handleBrowseRepository({
        workspace: 'workspace',
        repo_slug: 'repo',
        ref: 'main',
        path: 'src/index.ts',
      });

      expect(result.isError).toBeFalsy();
      // Output should look like file content, not a directory listing
      expect(result.content[0].text).toContain('File: src/index.ts');
      expect(result.content[0].text).toContain(
        '1: export const hello = "world";'
      );
      expect(result.content[0].text).not.toContain('📁');
      expect(result.content[0].text).not.toContain('📄');
      // Hint should point users at the dedicated tool
      expect(result.content[0].text).toContain('bb_get_file_content');
      // makeTextRequest must have been called to retrieve the file
      expect(mockMakeTextRequest).toHaveBeenCalledTimes(1);
    });

    it('should fall back to file content with commit SHA ref', async () => {
      // Caller passes a commit SHA directly; resolveRefToCommitSha tries branch → tag → commit
      const mockCommitResponse = { hash: 'a1712220e0e0' };
      const mockFileContent = 'console.log("hi");';
      mockMakeRequest
        .mockRejectedValueOnce(new BitbucketApiError(404, 'Not Found')) // branch lookup
        .mockRejectedValueOnce(new BitbucketApiError(404, 'Not Found')) // tag lookup
        .mockResolvedValueOnce(mockCommitResponse) // commit lookup
        .mockImplementationOnce(() => {
          throw new SyntaxError('Bad JSON');
        });
      mockMakeTextRequest.mockResolvedValueOnce(mockFileContent);

      const result = await handleBrowseRepository({
        workspace: 'workspace',
        repo_slug: 'repo',
        ref: 'a1712220e0e0',
        path: 'src/app.ts',
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('1: console.log("hi");');
    });

    it('should surface "ref not found" when ref cannot be resolved and the ref contains a slash', async () => {
      // resolveRefToCommitSha returns null (all 3 lookups 404)
      mockMakeRequest
        .mockRejectedValueOnce(new BitbucketApiError(404, 'Not Found')) // branch
        .mockRejectedValueOnce(new BitbucketApiError(404, 'Not Found')) // tag
        .mockRejectedValueOnce(new BitbucketApiError(404, 'Not Found')); // commit

      await expect(
        handleBrowseRepository({
          workspace: 'workspace',
          repo_slug: 'repo',
          ref: 'feature/missing',
          path: 'src',
        })
      ).rejects.toThrow(/Could not resolve ref 'feature\/missing'/);
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

    it('should resolve slash-containing branch via /refs/branches and read file by commit SHA', async () => {
      const mockBranchData = {
        name: 'feature/my-branch',
        target: { hash: 'deadbeef1234', date: '2024-01-01' },
      };
      const mockFileContent = 'file content here';

      mockMakeRequest.mockResolvedValueOnce(mockBranchData);
      mockMakeTextRequest.mockResolvedValueOnce(mockFileContent);

      const result = await handleGetFileContent({
        workspace: 'workspace',
        repo_slug: 'repo',
        file_path: 'src/index.ts',
        ref: 'feature/my-branch',
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('1: file content here');
      // File must be fetched via commit SHA, not the encoded branch name
      expect(mockMakeTextRequest).toHaveBeenCalledWith(
        expect.stringContaining('/src/deadbeef1234/')
      );
      expect(mockMakeTextRequest).not.toHaveBeenCalledWith(
        expect.stringContaining('feature%2F')
      );
    });

    it('should resolve tag ref via /refs/tags when branch lookup returns 404', async () => {
      const mockTagData = {
        name: 'v1.0.0',
        target: { hash: 'tagcommit123', date: '2024-01-01' },
      };
      const mockFileContent = 'tagged file content';

      mockMakeRequest
        .mockRejectedValueOnce(new BitbucketApiError(404, 'Not Found')) // branch not found
        .mockResolvedValueOnce(mockTagData); // tag found
      mockMakeTextRequest.mockResolvedValueOnce(mockFileContent);

      const result = await handleGetFileContent({
        workspace: 'workspace',
        repo_slug: 'repo',
        file_path: 'README.md',
        ref: 'v1.0.0',
      });

      expect(result.isError).toBeFalsy();
      expect(mockMakeTextRequest).toHaveBeenCalledWith(
        expect.stringContaining('/src/tagcommit123/')
      );
    });

    it('should rethrow non-404 resolution errors without falling back', async () => {
      mockMakeRequest.mockRejectedValueOnce(
        new BitbucketApiError(403, 'Forbidden', 'Access denied to repository')
      );

      await expect(
        handleGetFileContent({
          workspace: 'workspace',
          repo_slug: 'repo',
          file_path: 'secret.txt',
          ref: 'main',
        })
      ).rejects.toThrow('403 Forbidden');

      expect(mockMakeTextRequest).not.toHaveBeenCalled();
    });

    it('should throw targeted error for unresolvable slash-containing ref and not call makeTextRequest', async () => {
      // All three resolution endpoints return 404
      mockMakeRequest
        .mockRejectedValueOnce(new BitbucketApiError(404, 'Not Found')) // branch
        .mockRejectedValueOnce(new BitbucketApiError(404, 'Not Found')) // tag
        .mockRejectedValueOnce(new BitbucketApiError(404, 'Not Found')); // commit

      await expect(
        handleGetFileContent({
          workspace: 'workspace',
          repo_slug: 'repo',
          file_path: 'file.txt',
          ref: 'feature/nonexistent',
        })
      ).rejects.toThrow('Could not resolve ref');

      expect(mockMakeTextRequest).not.toHaveBeenCalled();
    });

    it('should resolve slash-containing branch for subdirectory via /refs/branches', async () => {
      const mockBranchData = {
        name: 'feature/my-branch',
        target: { hash: 'deadbeef1234', date: '2024-01-01' },
      };
      const mockDirResponse = {
        values: [{ type: 'commit_file', path: 'src/app.tsx' }],
      };

      mockMakeRequest
        .mockResolvedValueOnce(mockBranchData) // branch lookup
        .mockResolvedValueOnce(mockDirResponse); // directory listing

      const result = await handleBrowseRepository({
        workspace: 'workspace',
        repo_slug: 'repo',
        ref: 'feature/my-branch',
        path: 'src',
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('📄 src/app.tsx');
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
