/**
 * Tests for configuration management
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import {
  loadConfig,
  validateAuthentication,
  initializeConfig,
} from '../config.js';

describe('Configuration Management', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('loadConfig', () => {
    it('should load default configuration', () => {
      // Clear relevant env vars
      delete process.env.BITBUCKET_API_TOKEN;
      delete process.env.BITBUCKET_EMAIL;
      delete process.env.BITBUCKET_API_BASE;
      delete process.env.BITBUCKET_REQUEST_TIMEOUT;
      delete process.env.BITBUCKET_DEBUG;

      const config = loadConfig();

      expect(config.BITBUCKET_API_BASE).toBe('https://api.bitbucket.org/2.0');
      expect(config.BITBUCKET_REQUEST_TIMEOUT).toBe(30000);
      expect(config.BITBUCKET_DEBUG).toBe(false);
    });

    it('should parse environment variables correctly', () => {
      process.env.BITBUCKET_API_TOKEN = 'test-token';
      process.env.BITBUCKET_EMAIL = 'test@example.com';
      process.env.BITBUCKET_DEBUG = 'true';
      process.env.BITBUCKET_REQUEST_TIMEOUT = '60000';

      const config = loadConfig();

      expect(config.BITBUCKET_API_TOKEN).toBe('test-token');
      expect(config.BITBUCKET_EMAIL).toBe('test@example.com');
      expect(config.BITBUCKET_DEBUG).toBe(true);
      expect(config.BITBUCKET_REQUEST_TIMEOUT).toBe(60000);
    });

    it('should reject invalid email format', () => {
      process.env.BITBUCKET_EMAIL = 'invalid-email';

      expect(() => loadConfig()).toThrow('Configuration validation failed');
    });

    it('should reject invalid URL format', () => {
      process.env.BITBUCKET_API_BASE = 'not-a-url';

      expect(() => loadConfig()).toThrow('Configuration validation failed');
    });
  });

  describe('validateAuthentication', () => {
    it('should detect API token authentication', () => {
      const config = {
        BITBUCKET_API_TOKEN: 'test-token',
        BITBUCKET_EMAIL: 'test@example.com',
        BITBUCKET_API_BASE: 'https://api.bitbucket.org/2.0',
        BITBUCKET_REQUEST_TIMEOUT: 30000,
        BITBUCKET_DEBUG: false,
      };

      const auth = validateAuthentication(config);

      expect(auth.method).toBe('api-token');
      expect(auth.isValid).toBe(true);
      expect(auth.warning).toBeUndefined();
    });

    it('should detect no authentication', () => {
      const config = {
        BITBUCKET_API_TOKEN: undefined,
        BITBUCKET_EMAIL: undefined,
        BITBUCKET_API_BASE: 'https://api.bitbucket.org/2.0',
        BITBUCKET_REQUEST_TIMEOUT: 30000,
        BITBUCKET_DEBUG: false,
      };

      const auth = validateAuthentication(config);

      expect(auth.method).toBe('none');
      expect(auth.isValid).toBe(false);
      expect(auth.warning).toContain('public repositories');
    });
  });

  describe('initializeConfig', () => {
    // Mock console.error to test logging
    let consoleSpy: jest.SpiedFunction<typeof console.error>;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should initialize configuration and return config and auth', () => {
      process.env.BITBUCKET_API_TOKEN = 'test-token';
      process.env.BITBUCKET_EMAIL = 'test@example.com';

      const { config, auth } = initializeConfig();

      expect(config).toBeDefined();
      expect(auth).toBeDefined();
      expect(auth.method).toBe('api-token');
      expect(auth.isValid).toBe(true);
    });

    it('should log mode and authentication method', () => {
      process.env.BITBUCKET_API_TOKEN = 'test-token';
      process.env.BITBUCKET_EMAIL = 'test@example.com';

      initializeConfig();

      expect(consoleSpy).toHaveBeenCalledWith('🔒 Mode: READ-ONLY (by design)');
      expect(consoleSpy).toHaveBeenCalledWith('🔐 Auth: API-TOKEN');
    });

    it('should log warning for no authentication', () => {
      delete process.env.BITBUCKET_API_TOKEN;
      delete process.env.BITBUCKET_EMAIL;

      initializeConfig();

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️',
        expect.stringContaining('public repositories')
      );
    });

    it('should log debug information when enabled', () => {
      process.env.BITBUCKET_DEBUG = 'true';
      process.env.BITBUCKET_API_TOKEN = 'test-token';

      initializeConfig();

      expect(consoleSpy).toHaveBeenCalledWith('🐛 Debug mode enabled');
      expect(consoleSpy).toHaveBeenCalledWith('Debug - Environment variables:');
    });
  });
});
