import { describe, it, expect } from 'vitest';
import { db } from '../src/lib/db';
import { boqItemSchema, boqAanwijzingSchema } from '../src/lib/validation';

describe('Medium Severity Architecture & Quality Fixes', () => {
  describe('M8: DB Lazy-Loading Proxy', () => {
    it('should act as a fully functional better-sqlite3 database instance via Proxy', () => {
      // The db object is a Proxy. Let's make a simple PRAGMA query to verify it lazy-initializes successfully
      const result = db.prepare("SELECT 1 + 1 AS sum").get() as { sum: number };
      expect(result).toBeDefined();
      expect(result.sum).toBe(2);
    });

    it('should bind methods correctly to the underlying DB instance', () => {
      const statement = db.prepare("SELECT ? AS val");
      const result = statement.get("hello") as { val: string };
      expect(result.val).toBe("hello");
    });
  });

  describe('M7: Strict Zod BoQ Items Validation Schema', () => {
    it('should successfully validate valid BoQ items', () => {
      const validItem = {
        designator: 'PRE-OTB-12PORT',
        volume: 2.5,
        price: 150000,
        total: 375000,
        kind: 'material',
        sort_no: 1,
      };

      const parsed = boqItemSchema.safeParse(validItem);
      expect(parsed.success).toBe(true);
    });

    it('should reject BoQ items with missing mandatory fields', () => {
      const invalidItem = {
        volume: 2.5,
        price: 150000,
        // designator and total are missing!
      };

      const parsed = boqItemSchema.safeParse(invalidItem);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues.some(issue => issue.path.includes('designator'))).toBe(true);
        expect(parsed.error.issues.some(issue => issue.path.includes('total'))).toBe(true);
      }
    });

    it('should reject BoQ items with negative numeric values', () => {
      const invalidItem = {
        designator: 'PRE-OTB-12PORT',
        volume: -1, // Negative values should be rejected
        price: 150000,
        total: -150000,
      };

      const parsed = boqItemSchema.safeParse(invalidItem);
      expect(parsed.success).toBe(false);
    });

    it('should successfully validate boqAanwijzingSchema with nested boqItemSchema items', () => {
      const validAanwijzing = {
        aanwijzing_id: 'aanwijzing-123',
        nama_lop: 'LOP Sumbagteng FMC',
        id_ihld: 'IHLD-888-A',
        boq_items: [
          {
            designator: 'PRE-OTB-12PORT',
            volume: 2.0,
            price: 100000,
            total: 200000,
          }
        ]
      };

      const parsed = boqAanwijzingSchema.safeParse(validAanwijzing);
      expect(parsed.success).toBe(true);
    });

    it('should reject boqAanwijzingSchema if nested items are invalid', () => {
      const invalidAanwijzing = {
        aanwijzing_id: 'aanwijzing-123',
        nama_lop: 'LOP Sumbagteng FMC',
        id_ihld: 'IHLD-888-A',
        boq_items: [
          {
            designator: '', // Invalid empty designator
            volume: -2.0,   // Invalid negative volume
            price: 100000,
            total: 200000,
          }
        ]
      };

      const parsed = boqAanwijzingSchema.safeParse(invalidAanwijzing);
      expect(parsed.success).toBe(false);
    });
  });
});
