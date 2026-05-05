import { Project } from '@/lib/db';
import { parseJsonArray } from './json';
import { 
  formatDateID, 
  parseExcelDate, 
  formatExcelDate, 
  formatExcelDateShort 
} from './date';

export type StatusBucket = 'done' | 'progress' | 'cancelled' | 'other';

// Classify project status into bucket (done/progress/cancelled)
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

// Parse value to number with fallback to 0
export function parseNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

// Get port count from full_data (real or plan)
export function getPortCount(fd: unknown[]): number {
  const plan = parseNumber(fd[10]);
  const real = parseNumber(fd[29]);
  return real > 0 ? real : plan;
}

// Parse project full_data JSON to array
export function getFullDataArray(project: Project): unknown[] {
  return parseJsonArray(project.full_data || '[]');
}

export { parseExcelDate, formatExcelDate, formatExcelDateShort };
