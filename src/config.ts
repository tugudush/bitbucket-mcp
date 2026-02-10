/**
 * Configuration management with validation and type safety
 */

import { z } from 'zod';

// Configuration schema with validation
const ConfigSchema = z.object({
  // Authentication
  BITBUCKET_API_TOKEN: z.string().optional(),
  BITBUCKET_EMAIL: z.string().email().optional(),

  // API Configuration
  BITBUCKET_API_BASE: z.string().url().default('https://api.bitbucket.org/2.0'),
  BITBUCKET_REQUEST_TIMEOUT: z.string().transform(Number).default('30000'),

  // Debugging
  BITBUCKET_DEBUG: z
    .string()
    .transform(val => val === 'true')
    .default('false'),

  // Output format
  BITBUCKET_DEFAULT_FORMAT: z.enum(['text', 'json', 'toon']).optional(),
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
  method: 'api-token' | 'none';
  isValid: boolean;
  warning?: string;
}

export function validateAuthentication(config: Config): AuthMethod {
  if (config.BITBUCKET_API_TOKEN && config.BITBUCKET_EMAIL) {
    return { method: 'api-token', isValid: true };
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
  }

  return { config, auth };
}
