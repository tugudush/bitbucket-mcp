/**
 * Tests for issue handler functions
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleGetIssues, handleGetIssue } from '../../handlers/issue.js';

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

describe('Issue Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleGetIssues', () => {
    it('should list issues with state filtering', async () => {
      const mockResponse = {
        values: [
          {
            id: 1,
            title: 'Bug report',
            state: 'open',
            kind: 'bug',
            priority: 'major',
            reporter: { display_name: 'Alice' },
            created_on: '2024-01-01T00:00:00Z',
          },
          {
            id: 2,
            title: 'Feature request',
            state: 'open',
            kind: 'enhancement',
            priority: 'minor',
            reporter: { display_name: 'Bob' },
            created_on: '2024-01-02T00:00:00Z',
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetIssues({
        workspace: 'workspace',
        repo_slug: 'repo',
        state: 'open',
      });

      expect(result.content[0].text).toContain('#1');
      expect(result.content[0].text).toContain('Bug report');
      expect(result.content[0].text).toContain('bug');
      expect(result.content[0].text).toContain('#2');
      expect(result.content[0].text).toContain('Feature request');
      expect(result.isError).toBeFalsy();
    });

    it('should filter by kind', async () => {
      const mockResponse = {
        values: [
          {
            id: 1,
            title: 'Bug',
            state: 'open',
            kind: 'bug',
            reporter: { display_name: 'Alice' },
            created_on: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetIssues({
        workspace: 'workspace',
        repo_slug: 'repo',
        kind: 'bug',
      });

      expect(result.content[0].text).toContain('Bug');
    });

    it('should handle pagination', async () => {
      const mockResponse = {
        values: [
          {
            id: 1,
            title: 'Issue 1',
            state: 'open',
            reporter: { display_name: 'Alice' },
            created_on: '2024-01-01T00:00:00Z',
          },
        ],
        page: 2,
        next: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/issues?page=3',
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleGetIssues({
        workspace: 'workspace',
        repo_slug: 'repo',
        page: 2,
      });

      expect(result.content[0].text).toContain('Issues for workspace/repo');
    });
  });

  describe('handleGetIssue', () => {
    it('should fetch issue details', async () => {
      const mockIssue = {
        id: 1,
        title: 'Test issue',
        content: { raw: 'Issue description' },
        state: 'open',
        kind: 'bug',
        priority: 'major',
        reporter: { display_name: 'Alice' },
        assignee: { display_name: 'Bob' },
        created_on: '2024-01-01T00:00:00Z',
        updated_on: '2024-01-02T00:00:00Z',
      };

      mockMakeRequest.mockResolvedValueOnce(mockIssue);

      const result = await handleGetIssue({
        workspace: 'workspace',
        repo_slug: 'repo',
        issue_id: 1,
      });

      expect(result.content[0].text).toContain('#1');
      expect(result.content[0].text).toContain('Test issue');
      expect(result.content[0].text).toContain('Issue description');
      expect(result.content[0].text).toContain('bug');
      expect(result.content[0].text).toContain('major');
      expect(result.content[0].text).toContain('Alice');
      expect(result.content[0].text).toContain('Bob');
      expect(result.isError).toBeFalsy();
    });

    it('should handle missing optional fields', async () => {
      const mockIssue = {
        id: 1,
        title: 'Test issue',
        state: 'open',
        reporter: { display_name: 'Alice' },
        created_on: '2024-01-01T00:00:00Z',
      };

      mockMakeRequest.mockResolvedValueOnce(mockIssue);

      const result = await handleGetIssue({
        workspace: 'workspace',
        repo_slug: 'repo',
        issue_id: 1,
      });

      expect(result.content[0].text).toContain('Test issue');
      expect(result.content[0].text).toContain('Unassigned');
    });
  });
});
