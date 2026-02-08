/**
 * Tests for pull request handler functions
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  handleGetPullRequests,
  handleGetPullRequest,
  handleGetPullRequestComments,
  handleGetPullRequestComment,
  handleGetCommentThread,
  handleGetPullRequestActivity,
  handleGetPullRequestCommits,
  handleGetPullRequestStatuses,
} from '../../handlers/pullrequest.js';

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

describe('Pull Request Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleGetPullRequests', () => {
    it('should list pull requests with state filtering', async () => {
      const mockResponse = {
        values: [
          {
            id: 1,
            title: 'PR 1',
            state: 'OPEN',
            author: { display_name: 'Alice' },
            source: { branch: { name: 'feature' } },
            destination: { branch: { name: 'main' } },
            created_on: '2024-01-01T00:00:00Z',
          },
          {
            id: 2,
            title: 'PR 2',
            state: 'MERGED',
            author: { display_name: 'Bob' },
            source: { branch: { name: 'develop' } },
            destination: { branch: { name: 'main' } },
            created_on: '2024-01-02T00:00:00Z',
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetPullRequests({
        workspace: 'workspace',
        repo_slug: 'repo',
        state: 'OPEN',
      });

      expect(result.content[0].text).toContain('PR 1');
      expect(result.content[0].text).toContain('Alice');
      expect(result.isError).toBeFalsy();
    });
  });

  describe('handleGetPullRequest', () => {
    it('should fetch pull request details with reviewers', async () => {
      const mockPR = {
        id: 1,
        title: 'Test PR',
        description: 'Description',
        state: 'OPEN',
        author: { display_name: 'Alice' },
        source: { branch: { name: 'feature' } },
        destination: { branch: { name: 'main' } },
        reviewers: [{ display_name: 'Bob' }, { display_name: 'Charlie' }],
        created_on: '2024-01-01T00:00:00Z',
        updated_on: '2024-01-02T00:00:00Z',
      };

      mockMakeRequest.mockResolvedValueOnce(mockPR);

      const result = await handleGetPullRequest({
        workspace: 'workspace',
        repo_slug: 'repo',
        pull_request_id: 1,
      });

      expect(result.content[0].text).toContain('Test PR');
      expect(result.content[0].text).toContain('Alice');
      expect(result.content[0].text).toContain('Bob, Charlie');
      expect(result.content[0].text).toContain('feature → main');
    });
  });

  describe('handleGetPullRequestComments', () => {
    it('should list PR comments with inline details', async () => {
      const mockResponse = {
        values: [
          {
            id: 1,
            content: { raw: 'Comment 1' },
            user: { display_name: 'Alice' },
            created_on: '2024-01-01T00:00:00Z',
            inline: { path: 'src/file.ts', to: 10 },
          },
          {
            id: 2,
            content: { raw: 'Comment 2' },
            user: { display_name: 'Bob' },
            created_on: '2024-01-02T00:00:00Z',
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetPullRequestComments({
        workspace: 'workspace',
        repo_slug: 'repo',
        pull_request_id: 1,
      });

      expect(result.content[0].text).toContain('Comment 1');
      expect(result.content[0].text).toContain('File: src/file.ts, Line: 10');
      expect(result.content[0].text).toContain('Comment 2');
    });
  });

  describe('handleGetPullRequestComment', () => {
    it('should fetch single comment with inline formatting', async () => {
      const mockComment = {
        id: 1,
        content: { raw: 'Test comment' },
        user: { display_name: 'Alice' },
        created_on: '2024-01-01T00:00:00Z',
        updated_on: '2024-01-02T00:00:00Z',
        inline: { path: 'src/file.ts', to: 15 },
      };

      mockMakeRequest.mockResolvedValueOnce(mockComment);

      const result = await handleGetPullRequestComment({
        workspace: 'workspace',
        repo_slug: 'repo',
        pull_request_id: 1,
        comment_id: 1,
      });

      expect(result.content[0].text).toContain('Test comment');
      expect(result.content[0].text).toContain('Alice');
      expect(result.content[0].text).toContain('File: src/file.ts');
    });

    it('should indicate deleted comments', async () => {
      const mockComment = {
        id: 1,
        content: { raw: 'Deleted comment' },
        user: { display_name: 'Alice' },
        created_on: '2024-01-01T00:00:00Z',
        deleted: true,
      };

      mockMakeRequest.mockResolvedValueOnce(mockComment);

      const result = await handleGetPullRequestComment({
        workspace: 'workspace',
        repo_slug: 'repo',
        pull_request_id: 1,
        comment_id: 1,
      });

      expect(result.content[0].text).toContain(
        '[This comment has been deleted]'
      );
    });
  });

  describe('handleGetCommentThread', () => {
    it('should build comment thread with nested replies', async () => {
      const mockRoot = {
        id: 1,
        content: { raw: 'Root comment' },
        user: { display_name: 'Alice' },
        created_on: '2024-01-01T00:00:00Z',
      };

      const mockAllComments = {
        values: [
          {
            id: 1,
            content: { raw: 'Root comment' },
            user: { display_name: 'Alice' },
            created_on: '2024-01-01T00:00:00Z',
          },
          {
            id: 2,
            content: { raw: 'Reply 1' },
            user: { display_name: 'Bob' },
            created_on: '2024-01-02T00:00:00Z',
            parent: { id: 1 },
          },
          {
            id: 3,
            content: { raw: 'Reply 2' },
            user: { display_name: 'Charlie' },
            created_on: '2024-01-03T00:00:00Z',
            parent: { id: 1 },
          },
        ],
      };

      mockMakeRequest
        .mockResolvedValueOnce(mockRoot)
        .mockResolvedValueOnce(mockAllComments);

      const result = await handleGetCommentThread({
        workspace: 'workspace',
        repo_slug: 'repo',
        pull_request_id: 1,
        comment_id: 1,
      });

      expect(result.content[0].text).toContain('Root comment');
      expect(result.content[0].text).toContain('Reply 1');
      expect(result.content[0].text).toContain('Reply 2');
      expect(result.content[0].text).toContain('=== REPLIES (2) ===');
    });
  });

  describe('handleGetPullRequestActivity', () => {
    it('should list PR activity with type detection', async () => {
      const mockResponse = {
        values: [
          {
            comment: {
              id: 1,
              content: { raw: 'Activity comment' },
              user: { display_name: 'Alice' },
            },
            update: null,
            approval: null,
          },
          {
            comment: null,
            update: { date: '2024-01-02T00:00:00Z' },
            approval: null,
          },
          {
            comment: null,
            update: null,
            approval: {
              date: '2024-01-03T00:00:00Z',
              user: { display_name: 'Bob' },
            },
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetPullRequestActivity({
        workspace: 'workspace',
        repo_slug: 'repo',
        pull_request_id: 1,
      });

      expect(result.content[0].text).toContain('Activity comment');
      expect(result.content[0].text).toContain('Update');
      expect(result.content[0].text).toContain('Approval');
    });
  });

  describe('handleGetPullRequestCommits', () => {
    it('should list PR commits', async () => {
      const mockResponse = {
        values: [
          {
            hash: 'abc123',
            message: 'Commit 1',
            author: { user: { display_name: 'Alice' } },
            date: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetPullRequestCommits({
        workspace: 'workspace',
        repo_slug: 'repo',
        pull_request_id: 1,
      });

      expect(result.content[0].text).toContain('abc123');
      expect(result.content[0].text).toContain('Commit 1');
    });

    it('should handle empty commits', async () => {
      const mockResponse = { values: [] };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetPullRequestCommits({
        workspace: 'workspace',
        repo_slug: 'repo',
        pull_request_id: 1,
      });

      expect(result.content[0].text).toContain('No commits');
    });
  });

  describe('handleGetPullRequestStatuses', () => {
    it('should list statuses with icon mapping', async () => {
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
            key: 'lint',
            name: 'Lint',
            state: 'INPROGRESS',
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetPullRequestStatuses({
        workspace: 'workspace',
        repo_slug: 'repo',
        pull_request_id: 1,
      });

      expect(result.content[0].text).toContain('✅');
      expect(result.content[0].text).toContain('❌');
      expect(result.content[0].text).toContain('🔄');
      expect(result.content[0].text).toContain('Build');
      expect(result.content[0].text).toContain('Tests');
    });

    it('should handle empty statuses', async () => {
      const mockResponse = { values: [] };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetPullRequestStatuses({
        workspace: 'workspace',
        repo_slug: 'repo',
        pull_request_id: 1,
      });

      expect(result.content[0].text).toContain('No build statuses');
    });
  });
});
