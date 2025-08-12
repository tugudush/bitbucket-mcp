/**
 * Tests for custom error classes
 */

import { describe, it, expect } from '@jest/globals';
import {
  BitbucketApiError,
  AuthenticationError,
  NotFoundError,
  ForbiddenError,
  RateLimitError,
  createApiError,
} from '../errors.js';

describe('Custom Error Classes', () => {
  describe('BitbucketApiError', () => {
    it('should create error with status and message', () => {
      const error = new BitbucketApiError(
        500,
        'Internal Server Error',
        'Something went wrong'
      );

      expect(error.name).toBe('BitbucketApiError');
      expect(error.status).toBe(500);
      expect(error.statusText).toBe('Internal Server Error');
      expect(error.details).toBe('Something went wrong');
      expect(error.message).toBe(
        'Bitbucket API error: 500 Internal Server Error - Something went wrong'
      );
    });

    it('should create error without details', () => {
      const error = new BitbucketApiError(404, 'Not Found');

      expect(error.message).toBe('Bitbucket API error: 404 Not Found');
      expect(error.details).toBeUndefined();
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error with helpful message', () => {
      const error = new AuthenticationError();

      expect(error.name).toBe('AuthenticationError');
      expect(error.status).toBe(401);
      expect(error.suggestion).toContain('BITBUCKET_API_TOKEN');
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with resource context', () => {
      const error = new NotFoundError('repository');

      expect(error.name).toBe('NotFoundError');
      expect(error.status).toBe(404);
      expect(error.details).toContain('repository');
    });
  });

  describe('ForbiddenError', () => {
    it('should create forbidden error', () => {
      const error = new ForbiddenError('private repository');

      expect(error.name).toBe('ForbiddenError');
      expect(error.status).toBe(403);
      expect(error.details).toContain('private repository');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error', () => {
      const error = new RateLimitError();

      expect(error.name).toBe('RateLimitError');
      expect(error.status).toBe(429);
      expect(error.suggestion).toContain('wait');
    });
  });

  describe('createApiError', () => {
    it('should create AuthenticationError for 401 status', () => {
      const error = createApiError(401, 'Unauthorized');

      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.status).toBe(401);
    });

    it('should create ForbiddenError for 403 status', () => {
      const error = createApiError(
        403,
        'Forbidden',
        undefined,
        'https://api.bitbucket.org/2.0/repositories/workspace/repo'
      );

      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.status).toBe(403);
    });

    it('should create NotFoundError for 404 status', () => {
      const error = createApiError(
        404,
        'Not Found',
        undefined,
        'https://api.bitbucket.org/2.0/repositories/workspace/repo'
      );

      expect(error).toBeInstanceOf(BitbucketApiError);
      expect(error.status).toBe(404);
    });

    it('should create RateLimitError for 429 status', () => {
      const error = createApiError(429, 'Too Many Requests');

      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.status).toBe(429);
    });

    it('should create generic BitbucketApiError for other statuses', () => {
      const error = createApiError(500, 'Internal Server Error');

      expect(error).toBeInstanceOf(BitbucketApiError);
      expect(error).not.toBeInstanceOf(AuthenticationError);
      expect(error.status).toBe(500);
    });

    it('should extract error details from errorData', () => {
      const errorData = {
        error: {
          message: 'Repository not found',
          detail:
            'The repository does not exist or you do not have permission to access it',
        },
      };

      const error = createApiError(404, 'Not Found', errorData);

      expect(error.details).toContain('Repository not found');
      expect(error.details).toContain('does not exist');
    });

    it('should handle errorData with simple message', () => {
      const errorData = { message: 'Simple error message' };
      const error = createApiError(400, 'Bad Request', errorData);

      expect(error.details).toBe('Simple error message');
    });
  });
});
