// Unit tests for safe JSON parsing and array handling utilities
import { describe, it, expect } from 'vitest';
import { parseJsonArray, safeJsonParse } from '@/utils/json';

describe('JSON Utilities', () => {
  describe('parseJsonArray', () => {
    it('should parse valid JSON array', () => {
      expect(parseJsonArray('[1, 2, 3]')).toEqual([1, 2, 3]);
    });

    it('should return empty array for invalid JSON', () => {
      expect(parseJsonArray('invalid')).toEqual([]);
    });

    it('should return empty array for non-array JSON', () => {
      expect(parseJsonArray('{"a": 1}')).toEqual([]);
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"a": 1}', {})).toEqual({ a: 1 });
    });

    it('should return fallback for invalid JSON', () => {
      expect(safeJsonParse('invalid', { error: true })).toEqual({ error: true });
    });
  });
});
