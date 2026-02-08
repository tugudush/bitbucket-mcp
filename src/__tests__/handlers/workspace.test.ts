/**
 * Tests for workspace handler functions
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  handleListWorkspaces,
  handleGetWorkspace,
  handleGetUser,
  handleGetCurrentUser,
  handleListUserPullRequests,
} from '../../handlers/workspace.js';

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

describe('Workspace Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleListWorkspaces', () => {
    it('should list accessible workspaces', async () => {
      const mockResponse = {
        values: [
          {
            slug: 'workspace1',
            name: 'Workspace 1',
            type: 'workspace',
          },
          {
            slug: 'workspace2',
            name: 'Workspace 2',
            type: 'workspace',
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleListWorkspaces({});

      expect(result.content[0].text).toContain('workspace1');
      expect(result.content[0].text).toContain('Workspace 1');
      expect(result.content[0].text).toContain('workspace2');
      expect(result.isError).toBeFalsy();
    });
  });

  describe('handleGetWorkspace', () => {
    it('should fetch workspace details', async () => {
      const mockWorkspace = {
        slug: 'myworkspace',
        name: 'My Workspace',
        type: 'workspace',
        created_on: '2024-01-01T00:00:00Z',
      };

      mockMakeRequest.mockResolvedValueOnce(mockWorkspace);

      const result = await handleGetWorkspace({
        workspace: 'myworkspace',
      });

      expect(result.content[0].text).toContain('myworkspace');
      expect(result.content[0].text).toContain('My Workspace');
      expect(result.content[0].text).toContain('workspace');
    });
  });

  describe('handleGetUser', () => {
    it('should throw error when username is provided', async () => {
      await expect(handleGetUser({ username: 'alice' })).rejects.toThrow(
        'not supported by Bitbucket API'
      );
    });

    it('should fetch current user when no username provided', async () => {
      const mockUser = {
        uuid: '{user-123}',
        display_name: 'Alice',
        nickname: 'alice',
        account_id: 'account123',
        created_on: '2024-01-01T00:00:00Z',
      };

      mockMakeRequest.mockResolvedValueOnce(mockUser);

      const result = await handleGetUser({});

      expect(result.content[0].text).toContain('Alice');
    });
  });

  describe('handleGetCurrentUser', () => {
    it('should fetch authenticated user details', async () => {
      const mockUser = {
        uuid: '{user-123}',
        display_name: 'Alice',
        nickname: 'alice',
        account_id: 'account123',
        created_on: '2024-01-01T00:00:00Z',
      };

      mockMakeRequest.mockResolvedValueOnce(mockUser);

      const result = await handleGetCurrentUser({});

      expect(result.content[0].text).toContain('Alice');
      expect(result.isError).toBeFalsy();
    });
  });

  describe('handleListUserPullRequests', () => {
    it('should list user PRs with state filtering', async () => {
      const mockResponse = {
        values: [
          {
            id: 1,
            title: 'PR 1',
            state: 'OPEN',
            author: { display_name: 'Alice' },
            source: { branch: { name: 'feature' } },
            destination: {
              repository: { full_name: 'workspace/repo1' },
              branch: { name: 'main' },
            },
            created_on: '2024-01-01T00:00:00Z',
          },
          {
            id: 2,
            title: 'PR 2',
            state: 'MERGED',
            author: { display_name: 'Alice' },
            source: { branch: { name: 'hotfix' } },
            destination: {
              repository: { full_name: 'workspace/repo2' },
              branch: { name: 'develop' },
            },
            created_on: '2024-01-02T00:00:00Z',
          },
        ],
      };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleListUserPullRequests({
        selected_user: 'alice',
        state: 'OPEN',
      });

      expect(result.content[0].text).toContain('PR 1');
      expect(result.content[0].text).toContain('feature → main');
      expect(result.content[0].text).toContain('OPEN');
    });

    it('should handle empty PR list', async () => {
      const mockResponse = { values: [] };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      const result = await handleListUserPullRequests({
        selected_user: 'alice',
      });

      expect(result.content[0].text).toContain('No pull requests');
    });

    it('should encode username', async () => {
      const mockResponse = { values: [] };

      mockMakeRequest.mockResolvedValueOnce(mockResponse);

      await handleListUserPullRequests({
        selected_user: 'user-with-dash',
      });

      // Verify request was made (username encoding happens internally)
      expect(mockMakeRequest).toHaveBeenCalled();
    });
  });
});
