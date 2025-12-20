/**
 * Tests for API layer functionality
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  buildApiUrl,
  buildUrlParams,
  addQueryParams,
  buildAuthHeaders,
  buildRequestHeaders,
  BITBUCKET_API_BASE,
  VERSION,
} from '../api.js';

// Mock the config module
jest.mock('../config.js', () => ({
  loadConfig: jest.fn(),
}));

import { loadConfig } from '../config.js';

const mockLoadConfig = loadConfig as jest.MockedFunction<typeof loadConfig>;

describe('API Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildApiUrl', () => {
    it('should build correct URL for endpoint', () => {
      const url = buildApiUrl('/repositories/workspace/repo');
      expect(url).toBe(`${BITBUCKET_API_BASE}/repositories/workspace/repo`);
    });

    it('should handle endpoints without leading slash', () => {
      const url = buildApiUrl('workspaces');
      expect(url).toBe(`${BITBUCKET_API_BASE}workspaces`);
    });

    it('should handle complex paths', () => {
      const url = buildApiUrl(
        '/repositories/workspace/repo/pullrequests/123/comments'
      );
      expect(url).toBe(
        `${BITBUCKET_API_BASE}/repositories/workspace/repo/pullrequests/123/comments`
      );
    });
  });

  describe('buildUrlParams', () => {
    it('should build URLSearchParams from object', () => {
      const params = buildUrlParams({ page: 1, pagelen: 10 });
      expect(params.get('page')).toBe('1');
      expect(params.get('pagelen')).toBe('10');
    });

    it('should skip undefined and null values', () => {
      const params = buildUrlParams({
        page: 1,
        state: undefined,
        filter: null,
      });
      expect(params.get('page')).toBe('1');
      expect(params.has('state')).toBe(false);
      expect(params.has('filter')).toBe(false);
    });

    it('should limit pagelen to MAX_PAGE_SIZE', () => {
      const params = buildUrlParams({ pagelen: 500 });
      expect(params.get('pagelen')).toBe('100'); // MAX_PAGE_SIZE is 100
    });

    it('should handle string values', () => {
      const params = buildUrlParams({ state: 'OPEN', query: 'test search' });
      expect(params.get('state')).toBe('OPEN');
      expect(params.get('query')).toBe('test search');
    });
  });

  describe('addQueryParams', () => {
    it('should add query params to URL without existing params', () => {
      const url = addQueryParams('https://api.example.com/path', { page: 1 });
      expect(url).toBe('https://api.example.com/path?page=1');
    });

    it('should add query params to URL with existing params', () => {
      const url = addQueryParams(
        'https://api.example.com/path?existing=value',
        { page: 1 }
      );
      expect(url).toBe('https://api.example.com/path?existing=value&page=1');
    });

    it('should return original URL when no params provided', () => {
      const url = addQueryParams('https://api.example.com/path', {});
      expect(url).toBe('https://api.example.com/path');
    });

    it('should handle multiple params', () => {
      const url = addQueryParams('https://api.example.com/path', {
        page: 1,
        pagelen: 10,
        state: 'OPEN',
      });
      expect(url).toContain('page=1');
      expect(url).toContain('pagelen=10');
      expect(url).toContain('state=OPEN');
    });
  });

  describe('buildAuthHeaders', () => {
    it('should return API token auth headers when token and email configured', () => {
      mockLoadConfig.mockReturnValue({
        BITBUCKET_API_TOKEN: 'test-token',
        BITBUCKET_EMAIL: 'test@example.com',
        BITBUCKET_API_BASE: 'https://api.bitbucket.org/2.0',
        BITBUCKET_REQUEST_TIMEOUT: 30000,
        BITBUCKET_DEBUG: false,
      });

      const headers = buildAuthHeaders();

      expect(headers.Authorization).toBeDefined();
      expect(headers.Authorization).toMatch(/^Basic /);

      // Verify the auth is email:token
      const decoded = Buffer.from(
        headers.Authorization.replace('Basic ', ''),
        'base64'
      ).toString();
      expect(decoded).toBe('test@example.com:test-token');
    });

    it('should return empty object when no auth configured', () => {
      mockLoadConfig.mockReturnValue({
        BITBUCKET_API_TOKEN: undefined,
        BITBUCKET_EMAIL: undefined,
        BITBUCKET_API_BASE: 'https://api.bitbucket.org/2.0',
        BITBUCKET_REQUEST_TIMEOUT: 30000,
        BITBUCKET_DEBUG: false,
      });

      const headers = buildAuthHeaders();

      expect(headers.Authorization).toBeUndefined();
    });
  });

  describe('buildRequestHeaders', () => {
    beforeEach(() => {
      mockLoadConfig.mockReturnValue({
        BITBUCKET_API_TOKEN: 'test-token',
        BITBUCKET_EMAIL: 'test@example.com',
        BITBUCKET_API_BASE: 'https://api.bitbucket.org/2.0',
        BITBUCKET_REQUEST_TIMEOUT: 30000,
        BITBUCKET_DEBUG: false,
      });
    });

    it('should include Accept header', () => {
      const headers = buildRequestHeaders();
      expect(headers.Accept).toBe('application/json');
    });

    it('should allow custom Accept header', () => {
      const headers = buildRequestHeaders('text/plain');
      expect(headers.Accept).toBe('text/plain');
    });

    it('should include User-Agent with version', () => {
      const headers = buildRequestHeaders();
      expect(headers['User-Agent']).toBe(`bitbucket-mcp-server/${VERSION}`);
    });

    it('should include auth headers', () => {
      const headers = buildRequestHeaders();
      expect(headers.Authorization).toBeDefined();
    });
  });

  describe('VERSION', () => {
    it('should be defined and match expected format', () => {
      expect(VERSION).toBeDefined();
      expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('BITBUCKET_API_BASE', () => {
    it('should be the correct Bitbucket API URL', () => {
      expect(BITBUCKET_API_BASE).toBe('https://api.bitbucket.org/2.0');
    });
  });
});

describe('makeRequest', () => {
  // Note: These tests would require mocking fetch
  // For now, we test the helper functions above
  // Integration tests with actual API calls should be in a separate file

  it('should be tested with fetch mocking', () => {
    // TODO: Add makeRequest tests with fetch mocking
    expect(true).toBe(true);
  });
});
