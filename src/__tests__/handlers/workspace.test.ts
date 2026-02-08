/**
 * Tests for workspace handler functions
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  handleListWorkspaces,
  handleGetWorkspace,
  handleGetUser,
  handleGetCurrentUser,
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
    it('should fetch user by username/UUID using /users/{selected_user}', async () => {
      const mockUser = {
        uuid: '{user-456}',
        display_name: 'Alice',
        username: 'alice',
        account_id: 'account456',
        type: 'user',
        created_on: '2024-01-01T00:00:00Z',
      };

      mockMakeRequest.mockResolvedValueOnce(mockUser);

      const result = await handleGetUser({ selected_user: 'alice' });

      expect(result.content[0].text).toContain('Alice');
      expect(result.content[0].text).toContain('@alice');
      expect(mockMakeRequest).toHaveBeenCalledWith(
        expect.stringContaining('/users/alice')
      );
    });

    it('should fetch current user when no selected_user provided', async () => {
      const mockUser = {
        uuid: '{user-123}',
        display_name: 'Alice',
        username: 'alice',
        account_id: 'account123',
        type: 'user',
        created_on: '2024-01-01T00:00:00Z',
      };

      mockMakeRequest.mockResolvedValueOnce(mockUser);

      const result = await handleGetUser({});

      expect(result.content[0].text).toContain('Alice');
      expect(mockMakeRequest).toHaveBeenCalledWith(
        expect.stringContaining('/2.0/user')
      );
    });

    it('should handle private profile with limited fields', async () => {
      const mockUser = {
        uuid: '{user-789}',
        display_name: 'Private User',
        type: 'user',
      };

      mockMakeRequest.mockResolvedValueOnce(mockUser);

      const result = await handleGetUser({ selected_user: '{user-789}' });

      expect(result.content[0].text).toContain('Private User');
      expect(result.content[0].text).toContain('Not available');
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
});
