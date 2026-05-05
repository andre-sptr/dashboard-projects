import { z } from 'zod';

/**
 * Environment variable schema definition
 * Validates all required and optional environment variables on application startup
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development')
    .describe('Application environment'),

  // Database configuration
  DATABASE_PATH: z
    .string()
    .default('./data/projects.db')
    .describe('Path to SQLite database file'),

  // Excel data source for webhook sync (Google Sheets)
  SPREADSHEET_ID: z
    .string()
    .optional()
    .describe('Google Sheets spreadsheet ID for webhook synchronization'),

  SHEET_ID: z
    .string()
    .optional()
    .describe('Google Sheets sheet ID (gid) for webhook synchronization'),

  // Optional API configuration
  API_KEY: z
    .string()
    .optional()
    .describe('API key for external service authentication'),

  // Next.js built-in variables (optional validation)
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .optional()
    .describe('Public URL of the application'),
});

/**
 * Validated environment variables type
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * @throws {Error} If validation fails with detailed error messages
 */
function validateEnv(): Env {
  try {
    // Parse environment variables
    const parsed = envSchema.parse({
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_PATH: process.env.DATABASE_PATH,
      SPREADSHEET_ID: process.env.SPREADSHEET_ID,
      SHEET_ID: process.env.SHEET_ID,
      API_KEY: process.env.API_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    });

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors for better readability
      const errorMessages = error.issues.map((err) => {
        const path = err.path.join('.');
        return `  - ${path}: ${err.message}`;
      });

      const errorMessage = [
        '❌ Environment variable validation failed:',
        '',
        ...errorMessages,
        '',
        '💡 Please check your .env.local file and ensure all required variables are set correctly.',
        '📖 See README.md for environment variable documentation.',
      ].join('\n');

      throw new Error(errorMessage);
    }
    throw error;
  }
}

/**
 * Validated environment variables
 * Exported as a singleton to ensure validation happens once at startup
 */
export const env = validateEnv();

/**
 * Check if a specific environment variable is set
 * @param key - Environment variable name
 * @returns true if the variable is set and not empty
 */
export function hasEnvVar(key: keyof Env): boolean {
  const value = env[key];
  return value !== undefined && value !== null && value !== '';
}

/**
 * Get environment variable with type safety
 * @param key - Environment variable name
 * @returns The environment variable value
 */
export function getEnvVar<K extends keyof Env>(key: K): Env[K] {
  return env[key];
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return env.NODE_ENV === 'test';
}

/**
 * Check if Google Sheets credentials are configured for webhook sync
 */
export function hasGoogleSheetsConfig(): boolean {
  return hasEnvVar('SPREADSHEET_ID') && hasEnvVar('SHEET_ID');
}

/**
 * Get database path with fallback
 */
export function getDatabasePath(): string {
  return env.DATABASE_PATH;
}

/**
 * Get Google Sheets spreadsheet ID
 * @throws {Error} If SPREADSHEET_ID is not configured
 */
export function getSpreadsheetId(): string {
  if (!env.SPREADSHEET_ID) {
    throw new Error(
      'SPREADSHEET_ID is not configured. Please set it in your .env.local file to enable webhook synchronization.'
    );
  }
  return env.SPREADSHEET_ID;
}

/**
 * Get Google Sheets sheet ID (gid)
 * @throws {Error} If SHEET_ID is not configured
 */
export function getSheetId(): string {
  if (!env.SHEET_ID) {
    throw new Error(
      'SHEET_ID is not configured. Please set it in your .env.local file to enable webhook synchronization.'
    );
  }
  return env.SHEET_ID;
}

// Log environment validation success in development
if (isDevelopment()) {
  console.log('✅ Environment variables validated successfully');
  console.log(`📊 Database path: ${env.DATABASE_PATH}`);
  console.log(`🔗 Google Sheets configured: ${hasGoogleSheetsConfig() ? 'Yes' : 'No'}`);
}

// Made with Bob
