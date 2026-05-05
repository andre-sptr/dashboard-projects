/**
 * Common validation helper functions
 * Provides reusable validation logic across the application
 */

/**
 * Check if a value is empty (null, undefined, empty string, empty array)
 * @param value - Value to check
 * @returns true if empty, false otherwise
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Check if a string is a valid email
 * @param email - Email string to validate
 * @returns true if valid email, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a string is a valid phone number (Indonesian format)
 * @param phone - Phone number to validate
 * @returns true if valid phone number, false otherwise
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Indonesian phone numbers: 08xx-xxxx-xxxx or +62xxx-xxxx-xxxx
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Check if a string is a valid URL
 * @param url - URL string to validate
 * @returns true if valid URL, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize string by removing special characters
 * @param str - String to sanitize
 * @param allowSpaces - Whether to allow spaces (default: true)
 * @returns Sanitized string
 */
export function sanitizeString(str: string, allowSpaces: boolean = true): string {
  if (allowSpaces) {
    return str.replace(/[^a-zA-Z0-9\s-_]/g, '');
  }
  return str.replace(/[^a-zA-Z0-9-_]/g, '');
}

/**
 * Normalize whitespace in a string
 * Removes leading/trailing whitespace and collapses multiple spaces
 * @param str - String to normalize
 * @returns Normalized string
 */
export function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Check if a number is within a range
 * @param value - Number to check
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns true if within range, false otherwise
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Check if a string matches a pattern
 * @param str - String to check
 * @param pattern - RegExp pattern
 * @returns true if matches, false otherwise
 */
export function matchesPattern(str: string, pattern: RegExp): boolean {
  return pattern.test(str);
}

/**
 * Validate required fields in an object
 * @param obj - Object to validate
 * @param requiredFields - Array of required field names
 * @returns Object with validation result and missing fields
 */
export function validateRequiredFields(
  obj: Record<string, any>,
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

/**
 * Validate string length
 * @param str - String to validate
 * @param min - Minimum length (default: 0)
 * @param max - Maximum length (default: Infinity)
 * @returns true if valid length, false otherwise
 */
export function isValidLength(
  str: string,
  min: number = 0,
  max: number = Infinity
): boolean {
  const length = str.length;
  return length >= min && length <= max;
}

/**
 * Check if a value is a valid integer
 * @param value - Value to check
 * @returns true if valid integer, false otherwise
 */
export function isInteger(value: any): boolean {
  return Number.isInteger(Number(value));
}

/**
 * Check if a value is a valid positive number
 * @param value - Value to check
 * @returns true if positive number, false otherwise
 */
export function isPositiveNumber(value: any): boolean {
  const num = Number(value);
  return !isNaN(num) && num > 0;
}

/**
 * Check if a value is a valid non-negative number
 * @param value - Value to check
 * @returns true if non-negative number, false otherwise
 */
export function isNonNegativeNumber(value: any): boolean {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
}

/**
 * Truncate string to specified length with ellipsis
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @param ellipsis - Ellipsis string (default: '...')
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number, ellipsis: string = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Capitalize first letter of each word
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Convert string to slug format (lowercase, hyphenated)
 * @param str - String to convert
 * @returns Slug string
 */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Remove duplicate values from array
 * @param arr - Array to deduplicate
 * @returns Array with unique values
 */
export function uniqueArray<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Check if two arrays have the same elements (order doesn't matter)
 * @param arr1 - First array
 * @param arr2 - Second array
 * @returns true if arrays have same elements, false otherwise
 */
export function arraysEqual<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  return sorted1.every((val, idx) => val === sorted2[idx]);
}

/**
 * Clamp a number between min and max values
 * @param value - Number to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped number
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format number with thousand separators
 * @param num - Number to format
 * @param locale - Locale string (default: 'id-ID')
 * @returns Formatted number string
 */
export function formatNumber(num: number, locale: string = 'id-ID'): string {
  return num.toLocaleString(locale);
}

/**
 * Parse number from string with locale support
 * @param str - String to parse
 * @returns Parsed number or NaN
 */
export function parseNumber(str: string): number {
  // Remove thousand separators and replace comma with dot
  const cleaned = str.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned);
}

// Made with Bob
