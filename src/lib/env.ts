import { z } from 'zod';

// Environment variable validation schema
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development')
    .describe('Application environment'),

  DATABASE_PATH: z
    .string()
    .default('./data/projects.db')
    .describe('Path to SQLite database file'),

  SPREADSHEET_ID: z
    .string()
    .optional()
    .describe('Google Sheets spreadsheet ID for webhook synchronization'),

  SHEET_ID: z
    .string()
    .optional()
    .describe('Google Sheets sheet ID (gid) for webhook synchronization'),

  API_KEY: z
    .string()
    .optional()
    .describe('API key for external service authentication'),

  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .optional()
    .describe('Public URL of the application'),

  GOOGLE_APPLICATION_CREDENTIALS: z
    .string()
    .optional()
    .describe('Path to Google Service Account JSON key file'),
});

export type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables
function validateEnv(): Env {
  try {
    const parsed = envSchema.parse({
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_PATH: process.env.DATABASE_PATH,
      SPREADSHEET_ID: process.env.SPREADSHEET_ID,
      SHEET_ID: process.env.SHEET_ID,
      API_KEY: process.env.API_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
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

export const env = validateEnv();

// Check if environment variable is set
export function hasEnvVar(key: keyof Env): boolean {
  const value = env[key];
  return value !== undefined && value !== null && value !== '';
}

// Get environment variable with type safety
export function getEnvVar<K extends keyof Env>(key: K): Env[K] {
  return env[key];
}

// Check if running in development mode
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

// Check if running in production mode
export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

// Check if running in test mode
export function isTest(): boolean {
  return env.NODE_ENV === 'test';
}

// Check if Google Sheets config is available
export function hasGoogleSheetsConfig(): boolean {
  return hasEnvVar('SPREADSHEET_ID') && hasEnvVar('SHEET_ID');
}

// Get database path
export function getDatabasePath(): string {
  return env.DATABASE_PATH;
}

// Get Google Sheets spreadsheet ID
export function getSpreadsheetId(): string {
  if (!env.SPREADSHEET_ID) {
    throw new Error(
      'SPREADSHEET_ID is not configured. Please set it in your .env.local file to enable webhook synchronization.'
    );
  }
  return env.SPREADSHEET_ID;
}

// Get Google Sheets sheet ID (gid)
export function getSheetId(): string {
  if (!env.SHEET_ID) {
    throw new Error(
      'SHEET_ID is not configured. Please set it in your .env.local file to enable webhook synchronization.'
    );
  }
  return env.SHEET_ID;
}

if (isDevelopment()) {
  console.log('✅ Environment variables validated successfully');
  console.log(`📊 Database path: ${env.DATABASE_PATH}`);
  console.log(`🔗 Google Sheets configured: ${hasGoogleSheetsConfig() ? 'Yes' : 'No'}`);
}

