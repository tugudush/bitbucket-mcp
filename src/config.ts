/**
 * Configuration management with validation and type safety
 */

import { z } from 'zod';

// Configuration schema with validation
const ConfigSchema = z.object({
  // Authentication (prioritized order)
  BITBUCKET_API_TOKEN: z.string().optional(),
  BITBUCKET_EMAIL: z.string().email().optional(),
  BITBUCKET_USERNAME: z.string().optional(),
  BITBUCKET_APP_PASSWORD: z.string().optional(),

  // API Configuration
  BITBUCKET_API_BASE: z.string().url().default('https://api.bitbucket.org/2.0'),
  BITBUCKET_REQUEST_TIMEOUT: z.string().transform(Number).default('30000'),

  // Debugging
  BITBUCKET_DEBUG: z
    .string()
    .transform(val => val === 'true')
    .default('false'),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  try {
    return ConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('\n');

      throw new Error(`Configuration validation failed:\n${missingFields}`);
    }
    throw error;
  }
}

export interface AuthMethod {
  method: 'api-token' | 'app-password' | 'none';
  isValid: boolean;
  warning?: string;
}

export function validateAuthentication(config: Config): AuthMethod {
  if (config.BITBUCKET_API_TOKEN && config.BITBUCKET_EMAIL) {
    return { method: 'api-token', isValid: true };
  }

  if (config.BITBUCKET_USERNAME && config.BITBUCKET_APP_PASSWORD) {
    return {
      method: 'app-password',
      isValid: true,
      warning:
        'App Passwords are deprecated (Sept 9, 2025). Consider migrating to API tokens.',
    };
  }

  return {
    method: 'none',
    isValid: false,
    warning:
      'No authentication configured. Only public repositories will be accessible.',
  };
}

/**
 * Initialize and validate configuration, logging warnings as needed
 */
export function initializeConfig(): { config: Config; auth: AuthMethod } {
  const config = loadConfig();
  const auth = validateAuthentication(config);

  // Log authentication status
  if (!auth.isValid) {
    console.error('⚠️', auth.warning);
  } else if (auth.warning) {
    console.error('⚠️', auth.warning);
  }

  // Log operational mode
  console.error('🔒 Mode: READ-ONLY (by design)');
  console.error(`🔐 Auth: ${auth.method.toUpperCase()}`);

  if (config.BITBUCKET_DEBUG) {
    console.error('🐛 Debug mode enabled');
    console.error('Debug - Environment variables:');
    console.error(
      '  BITBUCKET_API_TOKEN:',
      config.BITBUCKET_API_TOKEN
        ? `SET (length: ${config.BITBUCKET_API_TOKEN.length})`
        : 'NOT SET'
    );
    console.error('  BITBUCKET_EMAIL:', config.BITBUCKET_EMAIL || 'NOT SET');
    console.error(
      '  BITBUCKET_USERNAME:',
      config.BITBUCKET_USERNAME || 'NOT SET'
    );
    console.error(
      '  BITBUCKET_APP_PASSWORD:',
      config.BITBUCKET_APP_PASSWORD ? 'SET' : 'NOT SET'
    );
  }

  return { config, auth };
}
