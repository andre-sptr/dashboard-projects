import { describe, it, expect, vi } from 'vitest';
import { parseBoQExcel } from '@/lib/excel';

// Mock xlsx library
vi.mock('xlsx', () => {
  return {
    read: vi.fn().mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: {
        'Sheet1': {}
      }
    }),
    utils: {
      sheet_to_json: vi.fn().mockReturnValue([
        [], [], [], [], // Skip first 4 rows
        ['ID1', 'BATCH1'],
        ['ID2', 'BATCH2']
      ])
    }
  };
});

describe('Excel Utilities', () => {
  describe('parseBoQExcel', () => {
    it('should parse buffer and return BoqRow array', async () => {
      const buffer = new Uint8Array([1, 2, 3]).buffer; // ArrayBuffer
      const data = parseBoQExcel(buffer);
      
      expect(data).toBeDefined();
      expect(data.length).toBe(2);
      expect(data[0].id_ihld).toBe('ID1');
      expect(data[1].id_ihld).toBe('ID2');
    });
  });
});
