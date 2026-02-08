/**
 * Tests for API layer functionality
 */

import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import {
  buildApiUrl,
  buildUrlParams,
  addQueryParams,
  buildAuthHeaders,
  buildRequestHeaders,
  makeRequest,
  makeTextRequest,
  fetchAllPages,
  BITBUCKET_API_BASE,
} from '../api.js';
import { VERSION } from '../version.js';
import { BitbucketApiError, AuthenticationError } from '../errors.js';

// Mock the config module
jest.mock('../config.js', () => ({
  loadConfig: jest.fn(),
}));

import { loadConfig } from '../config.js';

const mockLoadConfig = loadConfig as jest.MockedFunction<typeof loadConfig>;

// Mock global fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

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
  const defaultConfig = {
    BITBUCKET_API_TOKEN: 'test-token',
    BITBUCKET_EMAIL: 'test@example.com',
    BITBUCKET_API_BASE: 'https://api.bitbucket.org/2.0',
    BITBUCKET_REQUEST_TIMEOUT: 30000,
    BITBUCKET_DEBUG: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockLoadConfig.mockReturnValue(defaultConfig);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should make a successful JSON request', async () => {
    const mockData = { name: 'test-repo', full_name: 'workspace/test-repo' };
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), { status: 200 })
    );

    const promise = makeRequest(
      'https://api.bitbucket.org/2.0/repositories/workspace/test-repo'
    );
    jest.runAllTimers();
    const result = await promise;

    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should enforce read-only by blocking non-GET methods', async () => {
    await expect(
      makeRequest('https://api.bitbucket.org/2.0/test', { method: 'POST' })
    ).rejects.toThrow('Only GET requests are allowed. Attempted: POST');

    await expect(
      makeRequest('https://api.bitbucket.org/2.0/test', { method: 'DELETE' })
    ).rejects.toThrow('Only GET requests are allowed. Attempted: DELETE');

    await expect(
      makeRequest('https://api.bitbucket.org/2.0/test', { method: 'PUT' })
    ).rejects.toThrow('Only GET requests are allowed. Attempted: PUT');

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should force GET method in the actual fetch call', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );

    const promise = makeRequest('https://api.bitbucket.org/2.0/test');
    jest.runAllTimers();
    await promise;

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.bitbucket.org/2.0/test',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('should include auth and user-agent headers', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );

    const promise = makeRequest('https://api.bitbucket.org/2.0/test');
    jest.runAllTimers();
    await promise;

    const callHeaders = mockFetch.mock.calls[0][1]?.headers as Record<
      string,
      string
    >;
    expect(callHeaders['Accept']).toBe('application/json');
    expect(callHeaders['User-Agent']).toBe(`bitbucket-mcp-server/${VERSION}`);
    expect(callHeaders['Authorization']).toMatch(/^Basic /);
  });

  it('should throw BitbucketApiError on 404', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: { message: 'Repository not found' } }),
        {
          status: 404,
          statusText: 'Not Found',
        }
      )
    );

    const promise = makeRequest(
      'https://api.bitbucket.org/2.0/repositories/ws/repo'
    );
    jest.runAllTimers();

    await expect(promise).rejects.toThrow(BitbucketApiError);
    await promise.catch(err => {
      expect(err).toBeInstanceOf(BitbucketApiError);
      expect((err as BitbucketApiError).status).toBe(404);
    });
  });

  it('should throw AuthenticationError on 401', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'Unauthorized' } }), {
        status: 401,
        statusText: 'Unauthorized',
      })
    );

    const promise = makeRequest('https://api.bitbucket.org/2.0/test');
    jest.runAllTimers();

    await expect(promise).rejects.toThrow(AuthenticationError);
  });

  it('should retry on 500 server errors with exponential backoff', async () => {
    // First two calls: 500 error, third call: success
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Server error' }), {
          status: 500,
          statusText: 'Internal Server Error',
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Server error' }), {
          status: 500,
          statusText: 'Internal Server Error',
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

    const promise = makeRequest('https://api.bitbucket.org/2.0/test');

    // Advance through first retry backoff (1s)
    await jest.advanceTimersByTimeAsync(1000);
    // Advance through second retry backoff (2s)
    await jest.advanceTimersByTimeAsync(2000);
    // Run remaining timers
    jest.runAllTimers();

    const result = await promise;
    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should retry on 429 rate limit errors', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Rate limited' }), {
          status: 429,
          statusText: 'Too Many Requests',
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: 'ok' }), { status: 200 })
      );

    const promise = makeRequest('https://api.bitbucket.org/2.0/test');

    // Advance through first retry backoff (1s)
    await jest.advanceTimersByTimeAsync(1000);
    jest.runAllTimers();

    const result = await promise;
    expect(result).toEqual({ data: 'ok' });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should throw after exhausting all retry attempts on 500', async () => {
    // Each attempt needs a fresh Response (body can only be read once)
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Server error' }), {
          status: 500,
          statusText: 'Internal Server Error',
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Server error' }), {
          status: 500,
          statusText: 'Internal Server Error',
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Server error' }), {
          status: 500,
          statusText: 'Internal Server Error',
        })
      );

    const promise = makeRequest('https://api.bitbucket.org/2.0/test');
    // Capture the rejection early to avoid unhandled rejection during timer advancement
    const resultPromise = promise.then(
      () => {
        throw new Error('Expected rejection');
      },
      err => err
    );

    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(2000);
    jest.runAllTimers();

    const error = await resultPromise;
    expect(error).toBeInstanceOf(BitbucketApiError);
    expect((error as BitbucketApiError).status).toBe(500);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should not retry on non-retryable errors (400, 403)', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'Bad request' } }), {
        status: 400,
        statusText: 'Bad Request',
      })
    );

    const promise = makeRequest('https://api.bitbucket.org/2.0/test');
    jest.runAllTimers();

    await expect(promise).rejects.toThrow(BitbucketApiError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle timeout with AbortError', async () => {
    mockFetch.mockImplementation(() => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    mockLoadConfig.mockReturnValue({
      ...defaultConfig,
      BITBUCKET_REQUEST_TIMEOUT: 100,
    });

    const promise = makeRequest('https://api.bitbucket.org/2.0/test');
    const resultPromise = promise.then(
      () => {
        throw new Error('Expected rejection');
      },
      err => err
    );

    await jest.advanceTimersByTimeAsync(1500);
    await jest.advanceTimersByTimeAsync(2500);
    jest.runAllTimers();

    const error = await resultPromise;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toMatch(/Request timeout after/);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should handle non-JSON error responses gracefully', async () => {
    // 400 is NOT retryable, so only one call needed
    mockFetch.mockResolvedValueOnce(
      new Response('Plain text error - not JSON', {
        status: 400,
        statusText: 'Bad Request',
      })
    );

    const promise = makeRequest('https://api.bitbucket.org/2.0/test');
    jest.runAllTimers();

    await expect(promise).rejects.toThrow(BitbucketApiError);
    // Verify the plain text was captured in the error details
    await promise.catch(err => {
      expect((err as BitbucketApiError).details).toContain('Plain text error');
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should set AbortController signal on fetch', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );

    const promise = makeRequest('https://api.bitbucket.org/2.0/test');
    jest.runAllTimers();
    await promise;

    const callOptions = mockFetch.mock.calls[0][1];
    expect(callOptions?.signal).toBeDefined();
    expect(callOptions?.signal).toBeInstanceOf(AbortSignal);
  });
});

describe('fetchAllPages', () => {
  const defaultConfig = {
    BITBUCKET_API_TOKEN: 'test-token',
    BITBUCKET_EMAIL: 'test@example.com',
    BITBUCKET_API_BASE: 'https://api.bitbucket.org/2.0',
    BITBUCKET_REQUEST_TIMEOUT: 30000,
    BITBUCKET_DEBUG: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockLoadConfig.mockReturnValue(defaultConfig);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should fetch single page when no next link', async () => {
    const mockResponse = {
      values: [{ id: 1 }, { id: 2 }],
      size: 2,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const promise = fetchAllPages<{ id: number }>(
      'https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests/1/comments'
    );
    jest.runAllTimers();
    const result = await promise;

    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should fetch multiple pages and accumulate results', async () => {
    const firstPage = {
      values: [{ id: 1 }, { id: 2 }],
      size: 2,
      next: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests/1/comments?page=2',
    };

    const secondPage = {
      values: [{ id: 3 }, { id: 4 }],
      size: 2,
      next: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests/1/comments?page=3',
    };

    const thirdPage = {
      values: [{ id: 5 }],
      size: 1,
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => firstPage,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => secondPage,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => thirdPage,
      } as Response);

    const promise = fetchAllPages<{ id: number }>(
      'https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests/1/comments'
    );
    jest.runAllTimers();
    const result = await promise;

    expect(result).toEqual([
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
      { id: 5 },
    ]);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should respect maxPages limit and warn', async () => {
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const mockPage = {
      values: [{ id: 1 }],
      size: 1,
      next: 'https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests/1/comments?page=2',
    };

    // Mock fetch to always return a page with next link
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockPage,
    } as Response);

    const promise = fetchAllPages<{ id: number }>(
      'https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests/1/comments',
      2 // maxPages = 2
    );
    jest.runAllTimers();
    const result = await promise;

    // Should stop after 2 pages despite having more
    expect(result).toEqual([{ id: 1 }, { id: 1 }]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Reached max page limit (2)')
    );

    consoleWarnSpy.mockRestore();
  });

  it('should handle empty pages', async () => {
    const mockResponse = {
      values: [],
      size: 0,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const promise = fetchAllPages<{ id: number }>(
      'https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests/1/comments'
    );
    jest.runAllTimers();
    const result = await promise;

    expect(result).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should propagate errors from makeRequest', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => JSON.stringify({ message: 'Repository not found' }),
    } as Response);

    const promise = fetchAllPages<{ id: number }>(
      'https://api.bitbucket.org/2.0/repositories/workspace/repo/pullrequests/1/comments'
    );
    jest.runAllTimers();

    await expect(promise).rejects.toThrow();
  });
});

describe('makeTextRequest', () => {
  const defaultConfig = {
    BITBUCKET_API_TOKEN: 'test-token',
    BITBUCKET_EMAIL: 'test@example.com',
    BITBUCKET_API_BASE: 'https://api.bitbucket.org/2.0',
    BITBUCKET_REQUEST_TIMEOUT: 30000,
    BITBUCKET_DEBUG: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockLoadConfig.mockReturnValue(defaultConfig);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return text content on success', async () => {
    const textContent = 'line 1\nline 2\nline 3';
    mockFetch.mockResolvedValueOnce(new Response(textContent, { status: 200 }));

    const promise = makeTextRequest('https://api.bitbucket.org/2.0/test');
    jest.runAllTimers();
    const result = await promise;

    expect(result).toBe(textContent);
  });

  it('should enforce read-only by blocking non-GET methods', async () => {
    await expect(
      makeTextRequest('https://api.bitbucket.org/2.0/test', { method: 'POST' })
    ).rejects.toThrow('Only GET requests are allowed. Attempted: POST');

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should send Accept: text/plain header', async () => {
    mockFetch.mockResolvedValueOnce(new Response('content', { status: 200 }));

    const promise = makeTextRequest('https://api.bitbucket.org/2.0/test');
    jest.runAllTimers();
    await promise;

    const callHeaders = mockFetch.mock.calls[0][1]?.headers as Record<
      string,
      string
    >;
    expect(callHeaders['Accept']).toBe('text/plain');
  });

  it('should follow redirects (for PR diff endpoints)', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('diff content', { status: 200 })
    );

    const promise = makeTextRequest('https://api.bitbucket.org/2.0/test');
    jest.runAllTimers();
    await promise;

    const callOptions = mockFetch.mock.calls[0][1];
    expect(callOptions?.redirect).toBe('follow');
  });

  it('should retry on 500 server errors', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response('Server error', {
          status: 500,
          statusText: 'Internal Server Error',
        })
      )
      .mockResolvedValueOnce(
        new Response('recovered content', { status: 200 })
      );

    const promise = makeTextRequest('https://api.bitbucket.org/2.0/test');

    await jest.advanceTimersByTimeAsync(1000);
    jest.runAllTimers();

    const result = await promise;
    expect(result).toBe('recovered content');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should throw after exhausting retries', async () => {
    // Each retry needs a fresh Response
    mockFetch
      .mockResolvedValueOnce(
        new Response('error', {
          status: 503,
          statusText: 'Service Unavailable',
        })
      )
      .mockResolvedValueOnce(
        new Response('error', {
          status: 503,
          statusText: 'Service Unavailable',
        })
      )
      .mockResolvedValueOnce(
        new Response('error', {
          status: 503,
          statusText: 'Service Unavailable',
        })
      );

    const promise = makeTextRequest('https://api.bitbucket.org/2.0/test');
    const resultPromise = promise.then(
      () => {
        throw new Error('Expected rejection');
      },
      err => err
    );

    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(2000);
    jest.runAllTimers();

    const error = await resultPromise;
    expect(error).toBeInstanceOf(BitbucketApiError);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should not retry on 404 errors', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'Not found' } }), {
        status: 404,
        statusText: 'Not Found',
      })
    );

    const promise = makeTextRequest('https://api.bitbucket.org/2.0/test');
    jest.runAllTimers();

    await expect(promise).rejects.toThrow(BitbucketApiError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle timeout with AbortError and retry', async () => {
    mockFetch.mockImplementation(() => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    mockLoadConfig.mockReturnValue({
      ...defaultConfig,
      BITBUCKET_REQUEST_TIMEOUT: 100,
    });

    const promise = makeTextRequest('https://api.bitbucket.org/2.0/test');
    const resultPromise = promise.then(
      () => {
        throw new Error('Expected rejection');
      },
      err => err
    );

    await jest.advanceTimersByTimeAsync(1500);
    await jest.advanceTimersByTimeAsync(2500);
    jest.runAllTimers();

    const error = await resultPromise;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toMatch(/Request timeout after/);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should include auth headers', async () => {
    mockFetch.mockResolvedValueOnce(new Response('content', { status: 200 }));

    const promise = makeTextRequest('https://api.bitbucket.org/2.0/test');
    jest.runAllTimers();
    await promise;

    const callHeaders = mockFetch.mock.calls[0][1]?.headers as Record<
      string,
      string
    >;
    expect(callHeaders['Authorization']).toMatch(/^Basic /);
  });
});
