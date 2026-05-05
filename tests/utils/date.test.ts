// Unit tests for date formatting and Excel date parsing utilities
import { describe, it, expect } from 'vitest';
import { 
  formatDateID, 
  formatDateISO, 
  parseExcelDate, 
  formatRelativeTime,
  daysBetween
} from '@/utils/date';

describe('Date Utilities', () => {
  describe('formatDateID', () => {
    it('should format date to Indonesian locale', () => {
      const date = new Date('2024-05-05');
      const formatted = formatDateID(date);
      expect(formatted).toContain('Mei');
      expect(formatted).toContain('2024');
    });

    it('should return "Invalid Date" for invalid inputs', () => {
      expect(formatDateID('invalid')).toBe('Invalid Date');
    });
  });

  describe('formatDateISO', () => {
    it('should format date to YYYY-MM-DD', () => {
      const date = new Date(2024, 4, 5); // May 5
      expect(formatDateISO(date)).toBe('2024-05-05');
    });
  });

  describe('parseExcelDate', () => {
    it('should parse Excel serial numbers', () => {
      // 45417 is 2024-05-05
      const date = parseExcelDate(45417);
      expect(date).toBeDefined();
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(4); // May
      expect(date?.getDate()).toBe(5);
    });

    it('should parse DD/MM/YYYY strings', () => {
      const date = parseExcelDate('05/05/2024');
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(4);
      expect(date?.getDate()).toBe(5);
    });

    it('should return null for invalid inputs', () => {
      expect(parseExcelDate(null)).toBeNull();
      expect(parseExcelDate('')).toBeNull();
      expect(parseExcelDate('#N/A')).toBeNull();
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "Baru saja" for current time', () => {
      expect(formatRelativeTime(new Date())).toBe('Baru saja');
    });
  });

  describe('daysBetween', () => {
    it('should calculate days correctly', () => {
      const d1 = new Date('2024-05-05');
      const d2 = new Date('2024-05-10');
      expect(daysBetween(d1, d2)).toBe(5);
    });
  });
});
