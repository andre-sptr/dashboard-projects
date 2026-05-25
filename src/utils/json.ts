// Parse JSON with fallback on error
export function safeJsonParse<T = unknown>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
}

// Parse JSON ensuring result is an array
export function parseJsonArray<T = unknown>(jsonString: string, fallback: T[] = []): T[] {
  const parsed = safeJsonParse(jsonString, fallback);
  return Array.isArray(parsed) ? parsed : fallback;
}
