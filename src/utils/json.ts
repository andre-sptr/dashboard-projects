/**
 * JSON parsing and manipulation utilities
 * Provides safe JSON operations with error handling
 */

/**
 * Safely parse JSON string with fallback value
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback value
 */
export function safeJsonParse<T = any>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
}

/**
 * Safely parse JSON string with validation
 * @param jsonString - JSON string to parse
 * @param validator - Function to validate parsed object
 * @param fallback - Fallback value if parsing or validation fails
 * @returns Parsed and validated object or fallback value
 */
export function safeJsonParseWithValidation<T = any>(
  jsonString: string,
  validator: (value: any) => value is T,
  fallback: T
): T {
  try {
    const parsed = JSON.parse(jsonString);
    if (validator(parsed)) {
      return parsed;
    }
    console.warn('JSON validation failed');
    return fallback;
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
}

/**
 * Safely stringify object to JSON
 * @param value - Value to stringify
 * @param fallback - Fallback string if stringification fails
 * @param pretty - Whether to format with indentation
 * @returns JSON string or fallback
 */
export function safeJsonStringify(
  value: any,
  fallback: string = '{}',
  pretty: boolean = false
): string {
  try {
    return JSON.stringify(value, null, pretty ? 2 : 0);
  } catch (error) {
    console.warn('Failed to stringify JSON:', error);
    return fallback;
  }
}

/**
 * Parse JSON array with type checking
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback array if parsing fails
 * @returns Parsed array or fallback
 */
export function parseJsonArray<T = any>(jsonString: string, fallback: T[] = []): T[] {
  const parsed = safeJsonParse(jsonString, fallback);
  return Array.isArray(parsed) ? parsed : fallback;
}

/**
 * Parse JSON object with type checking
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback object if parsing fails
 * @returns Parsed object or fallback
 */
export function parseJsonObject<T extends Record<string, any> = Record<string, any>>(
  jsonString: string,
  fallback: T = {} as T
): T {
  const parsed = safeJsonParse(jsonString, fallback);
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    ? parsed
    : fallback;
}

/**
 * Deep clone an object using JSON serialization
 * Note: This will lose functions, undefined values, and circular references
 * @param obj - Object to clone
 * @returns Cloned object or null if cloning fails
 */
export function deepClone<T>(obj: T): T | null {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.warn('Failed to deep clone object:', error);
    return null;
  }
}

/**
 * Check if a string is valid JSON
 * @param str - String to check
 * @returns true if valid JSON, false otherwise
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Merge multiple JSON objects
 * Later objects override earlier ones
 * @param objects - JSON strings or objects to merge
 * @returns Merged object
 */
export function mergeJsonObjects<T extends Record<string, any> = Record<string, any>>(
  ...objects: (string | T)[]
): T {
  const result: any = {};

  for (const obj of objects) {
    const parsed = typeof obj === 'string' ? parseJsonObject(obj, {}) : obj;
    Object.assign(result, parsed);
  }

  return result as T;
}

/**
 * Extract specific fields from JSON object
 * @param jsonString - JSON string or object
 * @param fields - Array of field names to extract
 * @returns Object with only specified fields
 */
export function extractFields<T extends Record<string, any>>(
  jsonString: string | T,
  fields: string[]
): Partial<T> {
  const obj = typeof jsonString === 'string' ? parseJsonObject<T>(jsonString) : jsonString;
  const result: Partial<T> = {};

  for (const field of fields) {
    if (field in obj) {
      result[field as keyof T] = obj[field];
    }
  }

  return result;
}

/**
 * Remove null and undefined values from object
 * @param obj - Object to clean
 * @returns Cleaned object
 */
export function removeNullish<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      result[key as keyof T] = value;
    }
  }

  return result;
}

/**
 * Convert object to query string
 * @param obj - Object to convert
 * @returns Query string (without leading ?)
 */
export function objectToQueryString(obj: Record<string, any>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      params.append(key, String(value));
    }
  }

  return params.toString();
}

/**
 * Parse query string to object
 * @param queryString - Query string (with or without leading ?)
 * @returns Parsed object
 */
export function queryStringToObject(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString.startsWith('?') ? queryString.slice(1) : queryString);
  const result: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    result[key] = value;
  }

  return result;
}

// Made with Bob
