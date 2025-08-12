// Suggested improvement: Structured configuration management

import { z } from 'zod';

// Configuration schema with validation
const ConfigSchema = z.object({
  // Authentication (prioritized order)
  BITBUCKET_API_TOKEN: z.string().optional(),
  BITBUCKET_EMAIL: z.string().email().optional(),
  BITBUCKET_USERNAME: z.string().optional(),
  BITBUCKET_APP_PASSWORD: z.string().optional(),
  
  // Security
  BITBUCKET_READ_ONLY: z.string().transform(val => val === 'true').default('false'),
  
  // API Configuration
  BITBUCKET_API_BASE: z.string().url().default('https://api.bitbucket.org/2.0'),
  BITBUCKET_REQUEST_TIMEOUT: z.string().transform(Number).default('30000'),
  
  // Debugging
  BITBUCKET_DEBUG: z.string().transform(val => val === 'true').default('false'),
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

export function validateAuthentication(config: Config): {
  method: 'api-token' | 'app-password' | 'none';
  isValid: boolean;
  warning?: string;
} {
  if (config.BITBUCKET_API_TOKEN && config.BITBUCKET_EMAIL) {
    return { method: 'api-token', isValid: true };
  }
  
  if (config.BITBUCKET_USERNAME && config.BITBUCKET_APP_PASSWORD) {
    return { 
      method: 'app-password', 
      isValid: true,
      warning: 'App Passwords are deprecated (Sept 9, 2025). Consider migrating to API tokens.'
    };
  }
  
  return { 
    method: 'none', 
    isValid: false,
    warning: 'No authentication configured. Only public repositories will be accessible.'
  };
}

// Usage in main application:
export function initializeServer() {
  const config = loadConfig();
  const auth = validateAuthentication(config);
  
  if (!auth.isValid) {
    console.warn('⚠️', auth.warning);
  } else if (auth.warning) {
    console.warn('⚠️', auth.warning);
  }
  
  console.error(`🔒 Mode: ${config.BITBUCKET_READ_ONLY ? 'READ-ONLY' : 'FULL ACCESS'}`);
  console.error(`🔐 Auth: ${auth.method.toUpperCase()}`);
  
  return config;
}
