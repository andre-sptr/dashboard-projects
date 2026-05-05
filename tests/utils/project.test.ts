// Unit tests for project-specific calculations and status classification
import { describe, it, expect } from 'vitest';
import { classifyStatus, parseNumber, getPortCount } from '@/utils/project';

describe('Project Utilities', () => {
  describe('classifyStatus', () => {
    it('should classify "1. Planning" as progress', () => {
      expect(classifyStatus('1. Planning')).toBe('progress');
    });

    it('should classify "7. Done" as done', () => {
      expect(classifyStatus('7. Done')).toBe('done');
    });

    it('should classify "CANCELLED" as cancelled', () => {
      expect(classifyStatus('CANCELLED')).toBe('cancelled');
    });

    it('should classify unknown as other', () => {
      expect(classifyStatus('Unknown')).toBe('other');
    });
  });

  describe('parseNumber', () => {
    it('should parse valid numbers', () => {
      expect(parseNumber('123')).toBe(123);
      expect(parseNumber(123)).toBe(123);
    });

    it('should return 0 for invalid inputs', () => {
      expect(parseNumber('')).toBe(0);
      expect(parseNumber(null)).toBe(0);
      expect(parseNumber('abc')).toBe(0);
    });
  });

  describe('getPortCount', () => {
    it('should return real ports if available', () => {
      const fd = new Array(30).fill(0);
      fd[10] = 100; // Plan
      fd[29] = 120; // Real
      expect(getPortCount(fd)).toBe(120);
    });

    it('should return plan ports if real is 0', () => {
      const fd = new Array(30).fill(0);
      fd[10] = 100; // Plan
      fd[29] = 0;   // Real
      expect(getPortCount(fd)).toBe(100);
    });
  });
});
