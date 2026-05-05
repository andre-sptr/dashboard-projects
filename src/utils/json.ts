// Parse JSON with fallback on error
export function safeJsonParse<T = unknown>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
}

// Parse JSON with validation function
export function safeJsonParseWithValidation<T = unknown>(
  jsonString: string,
  validator: (value: unknown) => value is T,
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

// Stringify object to JSON with error handling
export function safeJsonStringify(
  value: unknown,
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

// Parse JSON ensuring result is an array
export function parseJsonArray<T = unknown>(jsonString: string, fallback: T[] = []): T[] {
  const parsed = safeJsonParse(jsonString, fallback);
  return Array.isArray(parsed) ? parsed : fallback;
}

// Parse JSON ensuring result is an object
export function parseJsonObject<T extends Record<string, unknown> = Record<string, unknown>>(
  jsonString: string,
  fallback: T = {} as T
): T {
  const parsed = safeJsonParse(jsonString, fallback);
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    ? parsed
    : fallback;
}

// Deep clone object via JSON serialization
export function deepClone<T>(obj: T): T | null {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.warn('Failed to deep clone object:', error);
    return null;
  }
}

// Check if string is valid JSON
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

// Merge multiple JSON objects (later overrides earlier)
export function mergeJsonObjects<T extends Record<string, unknown> = Record<string, unknown>>(
  ...objects: (string | T)[]
): T {
  const result: Record<string, unknown> = {};

  for (const obj of objects) {
    const parsed = typeof obj === 'string' ? parseJsonObject(obj, {}) : obj;
    Object.assign(result, parsed);
  }

  return result as T;
}

// Extract specific fields from JSON object
export function extractFields<T extends Record<string, unknown>>(
  jsonString: string | T,
  fields: string[]
): Partial<T> {
  const obj = typeof jsonString === 'string' ? parseJsonObject<T>(jsonString) : jsonString;
  const result: Partial<T> = {};

  for (const field of fields) {
    if (field in obj) {
      result[field as keyof T] = obj[field as keyof T] as any;
    }
  }

  return result;
}

// Remove null and undefined values from object
export function removeNullish<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      result[key as keyof T] = value as any;
    }
  }

  return result;
}

// Convert object to URL query string
export function objectToQueryString(obj: Record<string, unknown>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      params.append(key, String(value));
    }
  }

  return params.toString();
}

// Parse URL query string to object
export function queryStringToObject(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString.startsWith('?') ? queryString.slice(1) : queryString);
  const result: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    result[key] = value;
  }

  return result;
}

