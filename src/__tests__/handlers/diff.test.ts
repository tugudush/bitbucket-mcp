/**
 * Tests for diff handler functions
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  handleGetPullRequestDiff,
  handleGetPullRequestDiffstat,
  handleGetDiff,
  handleGetDiffstat,
} from '../../handlers/diff.js';

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

describe('Diff Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleGetPullRequestDiff', () => {
    it('should fetch PR diff as text', async () => {
      const mockDiff = `diff --git a/file.ts b/file.ts
index abc123..def456 100644
--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,4 @@
+new line
 existing line`;

      mockMakeTextRequest.mockResolvedValueOnce(mockDiff);

      const result = await handleGetPullRequestDiff({
        workspace: 'workspace',
        repo_slug: 'repo',
        pull_request_id: 1,
      });

      expect(result.content[0].text).toContain('diff --git');
      expect(result.content[0].text).toContain('+new line');
      expect(result.isError).toBeFalsy();
    });

    it('should handle empty diff', async () => {
      mockMakeTextRequest.mockResolvedValueOnce('');

      const result = await handleGetPullRequestDiff({
        workspace: 'workspace',
        repo_slug: 'repo',
        pull_request_id: 1,
      });

      expect(result.content[0].text).toContain('No changes found');
    });
  });

  describe('handleGetPullRequestDiffstat', () => {
    it('should fetch PR diffstat with file stats', async () => {
      const mockResponse = {
        values: [
          {
            type: 'diffstat',
            status: 'modified',
            old: { path: 'file1.ts' },
            new: { path: 'file1.ts' },
            lines_added: 10,
            lines_removed: 5,
          },
          {
            type: 'diffstat',
            status: 'added',
            old: null,
            new: { path: 'file2.ts' },
            lines_added: 20,
            lines_removed: 0,
          },
          {
            type: 'diffstat',
            status: 'removed',
            old: { path: 'file3.ts' },
            new: null,
            lines_added: 0,
            lines_removed: 15,
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetPullRequestDiffstat({
        workspace: 'workspace',
        repo_slug: 'repo',
        pull_request_id: 1,
      });

      expect(result.content[0].text).toContain('file1.ts');
      expect(result.content[0].text).toContain('+10 -5');
      expect(result.content[0].text).toContain('file2.ts');
      expect(result.content[0].text).toContain('ADDED');
      expect(result.content[0].text).toContain('file3.ts');
      expect(result.content[0].text).toContain('REMOVED');
      expect(result.content[0].text).toContain('+30 -20');
    });

    it('should handle renamed files', async () => {
      const mockResponse = {
        values: [
          {
            type: 'diffstat',
            status: 'renamed',
            old: { path: 'old.ts' },
            new: { path: 'new.ts' },
            lines_added: 5,
            lines_removed: 3,
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetPullRequestDiffstat({
        workspace: 'workspace',
        repo_slug: 'repo',
        pull_request_id: 1,
      });

      expect(result.content[0].text).toContain('old.ts → new.ts');
    });
  });

  describe('handleGetDiff', () => {
    it('should fetch commit diff with spec', async () => {
      const mockDiff = `diff --git a/file.ts b/file.ts
--- a/file.ts
+++ b/file.ts
@@ -1 +1,2 @@
 line 1
+line 2`;

      mockMakeTextRequest.mockResolvedValueOnce(mockDiff);

      const result = await handleGetDiff({
        workspace: 'workspace',
        repo_slug: 'repo',
        spec: 'abc123..def456',
      });

      expect(result.content[0].text).toContain('diff --git');
      expect(result.content[0].text).toContain('+line 2');
    });

    it('should handle empty diff', async () => {
      mockMakeTextRequest.mockResolvedValueOnce('');

      const result = await handleGetDiff({
        workspace: 'workspace',
        repo_slug: 'repo',
        spec: 'abc123',
      });

      expect(result.content[0].text).toContain('No changes found');
    });
  });

  describe('handleGetDiffstat', () => {
    it('should fetch commit diffstat', async () => {
      const mockResponse = {
        values: [
          {
            type: 'diffstat',
            status: 'modified',
            old: { path: 'src/file.ts' },
            new: { path: 'src/file.ts' },
            lines_added: 15,
            lines_removed: 8,
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetDiffstat({
        workspace: 'workspace',
        repo_slug: 'repo',
        spec: 'abc123',
      });

      expect(result.content[0].text).toContain('src/file.ts');
      expect(result.content[0].text).toContain('+15 -8');
    });
  });
});
