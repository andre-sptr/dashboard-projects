/**
 * Common utility functions for the Dashboard Project
 */

import { Project } from '@/lib/db';

export type StatusBucket = 'done' | 'progress' | 'cancelled' | 'other';

/**
 * Classifies a status string into a bucket
 */
export function classifyStatus(status: string): StatusBucket {
  const s = (status || '').toLowerCase().trim();

  if (/^[1-6]\./.test(s)) return 'progress';
  if (/^[7-8]\./.test(s)) return 'done';

  if (s.includes('done') || s.includes('complete') || s.includes('closed') || s.includes('golive'))
    return 'done';
  if (s.includes('cancel') || s.includes('reject') || s.includes('drop')) return 'cancelled';
  if (s.includes('progress') || s.includes('ongoing') || s.includes('running')) return 'progress';

  return 'other';
}

/**
 * Parses a numeric value or returns 0
 */
export function parseNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Gets the port count from full data array
 * Index 10: Plan, Index 29: Real
 */
export function getPortCount(fd: unknown[]): number {
  const plan = parseNumber(fd[10]);
  const real = parseNumber(fd[29]);
  return real > 0 ? real : plan;
}

/**
 * Safely parses full_data JSON string
 */
export function getFullDataArray(project: Project): unknown[] {
  try {
    const parsed = JSON.parse(project.full_data || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Parses Excel serial date or string date to JS Date
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
 * Formats Excel date for display
 */
export function formatExcelDate(value: unknown): string {
  const date = parseExcelDate(value);
  if (!date) return '-';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/**
 * Formats Excel date to short string (e.g. "Mei 2024")
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
