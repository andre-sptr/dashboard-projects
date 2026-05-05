/**
 * Date formatting and manipulation utilities
 * Provides consistent date handling across the application
 */

/**
 * Format date to Indonesian locale string
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDateID(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  return dateObj.toLocaleDateString('id-ID', defaultOptions);
}

/**
 * Format date to YYYY-MM-DD format
 * @param date - Date string or Date object
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateISO(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Format date to DD/MM/YYYY format
 * @param date - Date string or Date object
 * @returns Date string in DD/MM/YYYY format
 */
export function formatDateDDMMYYYY(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Format date with time to Indonesian locale
 * @param date - Date string or Date object
 * @returns Formatted date and time string
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  return dateObj.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date to relative time (e.g., "2 hari yang lalu")
 * @param date - Date string or Date object
 * @returns Relative time string in Indonesian
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return 'Baru saja';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} menit yang lalu`;
  } else if (diffHours < 24) {
    return `${diffHours} jam yang lalu`;
  } else if (diffDays < 30) {
    return `${diffDays} hari yang lalu`;
  } else if (diffMonths < 12) {
    return `${diffMonths} bulan yang lalu`;
  } else {
    return `${diffYears} tahun yang lalu`;
  }
}

/**
 * Parse date string with various formats
 * Handles common date formats and normalizes them
 * @param dateStr - Date string to parse
 * @returns Date object or null if invalid
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Try ISO format first
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Try DD/MM/YYYY format
  const ddmmyyyyMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try DD-MM-YYYY format
  const ddmmyyyyDashMatch = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyyDashMatch) {
    const [, day, month, year] = ddmmyyyyDashMatch;
    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

/**
 * Check if a date string is valid
 * @param dateStr - Date string to validate
 * @returns true if valid, false otherwise
 */
export function isValidDate(dateStr: string): boolean {
  const date = parseDate(dateStr);
  return date !== null && !isNaN(date.getTime());
}

/**
 * Get start of day for a date
 * @param date - Date string or Date object
 * @returns Date object set to start of day (00:00:00)
 */
export function startOfDay(date: string | Date): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
}

/**
 * Get end of day for a date
 * @param date - Date string or Date object
 * @returns Date object set to end of day (23:59:59)
 */
export function endOfDay(date: string | Date): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
}

/**
 * Calculate difference between two dates in days
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days between dates
 */
export function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Add days to a date
 * @param date - Date string or Date object
 * @param days - Number of days to add (can be negative)
 * @returns New Date object
 */
export function addDays(date: string | Date, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
}

/**
 * Get current date in YYYY-MM-DD format
 * @returns Current date string
 */
export function getCurrentDateISO(): string {
  return formatDateISO(new Date());
}

/**
 * Get current timestamp in ISO format
 * @returns Current timestamp string
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Parses Excel serial date or string date to JS Date
 * @param value - Excel date value (serial number or string)
 * @returns Date object or null if invalid
 */
export function parseExcelDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '' || String(value).trim() === '#N/A') return null;

  const strVal = String(value).trim().toUpperCase();

  // Handle Excel Serial Number
  const serial = Number(strVal);
  if (!isNaN(serial) && serial > 1000) {
    return new Date((serial - 25569) * 86400 * 1000);
  }

  // Handle Month Name (e.g. "JAN")
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthIdx = months.indexOf(strVal);
  if (monthIdx !== -1) {
    const now = new Date();
    return new Date(now.getFullYear(), monthIdx, 1);
  }

  // Handle DD/MM/YYYY
  if (strVal.includes('/')) {
    const parts = strVal.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      if (!isNaN(date.getTime())) return date;
    }
  }

  const date = new Date(strVal);
  if (!isNaN(date.getTime())) return date;

  return null;
}

/**
 * Formats Excel date for display in Indonesian format
 * @param value - Excel date value
 * @returns Formatted date string or '-'
 */
export function formatExcelDate(value: unknown): string {
  const date = parseExcelDate(value);
  if (!date) return '-';
  return formatDateID(date, { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Formats Excel date to short string (e.g. "Mei 2024")
 * @param value - Excel date value
 * @returns Formatted short date string or null
 */
export function formatExcelDateShort(value: unknown): string | null {
  const date = parseExcelDate(value);
  if (!date) return null;
  return date.toLocaleDateString('id-ID', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// Made with Bob
