// Check if value is empty (null/undefined/empty string/array)
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate Indonesian phone number format
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

// Validate URL format
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Remove special characters from string
export function sanitizeString(str: string, allowSpaces: boolean = true): string {
  if (allowSpaces) {
    return str.replace(/[^a-zA-Z0-9\s-_]/g, '');
  }
  return str.replace(/[^a-zA-Z0-9-_]/g, '');
}

// Normalize whitespace (trim and collapse multiple spaces)
export function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

// Check if number is within range (inclusive)
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

// Check if string matches regex pattern
export function matchesPattern(str: string, pattern: RegExp): boolean {
  return pattern.test(str);
}

// Validate required fields in object
export function validateRequiredFields(
  obj: Record<string, unknown>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (isEmpty(obj[field])) {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

// Check if string length is within bounds
export function isValidLength(
  str: string,
  min: number = 0,
  max: number = Infinity
): boolean {
  const length = str.length;
  return length >= min && length <= max;
}

// Check if value is an integer
export function isInteger(value: unknown): boolean {
  return Number.isInteger(Number(value));
}

// Check if value is a positive number
export function isPositiveNumber(value: unknown): boolean {
  const num = Number(value);
  return !isNaN(num) && num > 0;
}

// Check if value is non-negative number
export function isNonNegativeNumber(value: unknown): boolean {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
}

// Truncate string with ellipsis
export function truncate(str: string, maxLength: number, ellipsis: string = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
}

// Capitalize first letter of each word
export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

// Convert string to slug (lowercase, hyphenated)
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Remove duplicate values from array
export function uniqueArray<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// Check if arrays have same elements (order independent)
export function arraysEqual<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  return sorted1.every((val, idx) => val === sorted2[idx]);
}

// Clamp number between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Format number with thousand separators
export function formatNumber(num: number, locale: string = 'id-ID'): string {
  return num.toLocaleString(locale);
}

// Parse number from string (handles locale separators)
export function parseNumber(str: string): number {
  const cleaned = str.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned);
}

