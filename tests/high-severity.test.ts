import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateMagicBytes } from '../src/lib/validation';
import { AuditLogger } from '../src/lib/audit-logger';
import { AuditLogRepository } from '../src/repositories/AuditLogRepository';
import fs from 'fs';
import path from 'path';

// Mock repository for testing
vi.mock('../src/repositories/AuditLogRepository', () => {
  return {
    AuditLogRepository: {
      create: vi.fn(),
    },
  };
});

describe('High Severity Security & Logic Fixes', () => {
  describe('H4: Magic Bytes Validation', () => {
    it('should correctly validate Excel files (.xlsx) based on signature (PK...)', () => {
      // 50 4B 03 04 corresponds to 'PK\x03\x04'
      const mockXlsxBuffer = new Uint8Array([0x50, 0x4B, 0x03, 0x04, 0x00, 0x11]).buffer;
      expect(validateMagicBytes(mockXlsxBuffer, 'report.xlsx')).toBe(true);
      
      const dangerousBuffer = new Uint8Array([0x7f, 0x45, 0x4c, 0x46]).buffer; // ELF executable signature
      expect(validateMagicBytes(dangerousBuffer, 'report.xlsx')).toBe(false);
    });

    it('should correctly validate PDF files based on %PDF signature', () => {
      const mockPdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x31, 0x2e]).buffer;
      expect(validateMagicBytes(mockPdfBuffer, 'document.pdf')).toBe(true);
      
      const wrongBuffer = new Uint8Array([0x12, 0x34, 0x56, 0x78]).buffer;
      expect(validateMagicBytes(wrongBuffer, 'document.pdf')).toBe(false);
    });
  });

  describe('H5: Audit Logger DB Failure Fallback', () => {
    const fallbackFile = path.join(process.cwd(), 'data', 'logs', 'audit_fallback.log');

    beforeEach(() => {
      // Clean up fallback log file if exists
      if (fs.existsSync(fallbackFile)) {
        fs.unlinkSync(fallbackFile);
      }
      vi.clearAllMocks();
    });

    afterEach(() => {
      if (fs.existsSync(fallbackFile)) {
        fs.unlinkSync(fallbackFile);
      }
    });

    it('should write to fallback audit_fallback.log if DB creation fails', async () => {
      // Force mock repository to throw an error simulating locked/full DB
      vi.mocked(AuditLogRepository.create).mockImplementationOnce(() => {
        throw new Error('Database locked / write failed');
      });

      await AuditLogger.log(
        'user-test-123',
        'UPLOAD',
        'document',
        'doc-abc-999',
        { original: 'old' },
        { current: 'new' }
      );

      // Verify the fallback file is created and contains the logged data
      expect(fs.existsSync(fallbackFile)).toBe(true);
      const logContent = fs.readFileSync(fallbackFile, 'utf8');
      
      expect(logContent).toContain('user-test-123');
      expect(logContent).toContain('UPLOAD');
      expect(logContent).toContain('doc-abc-999');
      expect(logContent).toContain('old');
      expect(logContent).toContain('new');
    });

    it('should log successfully to DB without using fallback if no DB error occurs', async () => {
      vi.mocked(AuditLogRepository.create).mockImplementationOnce(() => {
        return { id: 1 };
      });

      await AuditLogger.log(
        'user-test-123',
        'CREATE',
        'project',
        'proj-uuid'
      );

      expect(AuditLogRepository.create).toHaveBeenCalledTimes(1);
      expect(fs.existsSync(fallbackFile)).toBe(false);
    });
  });
});
