import { describe, it, expect, afterEach, afterAll } from 'vitest';
import { FileStorage } from '../src/lib/file-storage';
import { ForbiddenError } from '../src/lib/errors';
import fs from 'fs';
import path from 'path';

describe('FileStorage Security & Path Traversal Protection', () => {
  it('should block getFileStats with relative path traversing outside allowed directory', () => {
    // Attempt path traversal with ".."
    const dangerousPath = '../../package.json';
    
    expect(() => {
      FileStorage.getFileStats(dangerousPath);
    }).toThrow(ForbiddenError);
  });

  it('should block deleteFile with relative path traversing outside allowed directory', () => {
    const dangerousPath = '/uploads/documents/../../../package.json';
    
    expect(() => {
      FileStorage.deleteFile(dangerousPath);
    }).toThrow(ForbiddenError);
  });

  it('should allow valid paths within the uploads directory', () => {
    const validRelativePath = '/uploads/documents/test-file.xlsx';
    
    // We expect it not to throw a ForbiddenError (it might return null because the file doesn't exist, which is correct)
    const stats = FileStorage.getFileStats(validRelativePath);
    expect(stats).toBeNull();
  });

  it('should block path names containing null bytes', () => {
    const dangerousPath = '/uploads/documents/test\0file.xlsx';
    
    expect(() => {
      FileStorage.getFileStats(dangerousPath);
    }).toThrow(ForbiddenError);
  });
});

describe('FileStorage File Operations', () => {
  const createdFiles: string[] = [];

  afterEach(() => {
    // Bersihkan file yang berhasil dibuat saat pengujian
    for (const filePath of createdFiles) {
      try {
        const fullPath = path.join(process.cwd(), 'public', filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (err) {
        console.error('Failed to clean up test file:', err);
      }
    }
  });

  it('should successfully save a file to the root uploads directory', async () => {
    const mockContent = 'hello world';
    const mockFile = new File([mockContent], 'invoice.pdf', { type: 'application/pdf' });

    const info = await FileStorage.saveFile(mockFile);
    expect(info.name).toBe('invoice.pdf');
    expect(info.type).toBe('application/pdf');
    expect(info.size).toBe(mockContent.length);
    expect(info.path).toMatch(/^\/uploads\/documents\/[0-9a-f-]+\.pdf$/);

    createdFiles.push(info.path);

    // Verifikasi file benar-benar ada di disk
    const stats = FileStorage.getFileStats(info.path);
    expect(stats).not.toBeNull();
    expect(stats?.size).toBe(mockContent.length);

    // Verifikasi isi file sesuai
    const fullPath = path.join(process.cwd(), 'public', info.path);
    const contentOnDisk = fs.readFileSync(fullPath, 'utf8');
    expect(contentOnDisk).toBe(mockContent);
  });

  it('should successfully save a file to a dynamic subfolder', async () => {
    const mockContent = 'excel data';
    const mockFile = new File([mockContent], 'report.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const info = await FileStorage.saveFile(mockFile, '2026/q2');
    expect(info.name).toBe('report.xlsx');
    expect(info.path).toMatch(/^\/uploads\/documents\/2026\/q2\/[0-9a-f-]+\.xlsx$/);

    createdFiles.push(info.path);

    // Verifikasi file dan folder terbuat
    const stats = FileStorage.getFileStats(info.path);
    expect(stats).not.toBeNull();

    // Verifikasi pembersihan folder dinamis
    const folderPath = path.join(process.cwd(), 'public', 'uploads', 'documents', '2026', 'q2');
    expect(fs.existsSync(folderPath)).toBe(true);

    // Cleanup manual subfolders jika perlu
    const parent2026 = path.join(process.cwd(), 'public', 'uploads', 'documents', '2026');
    afterAll(() => {
      try {
        if (fs.existsSync(folderPath)) {
          fs.rmdirSync(folderPath);
        }
        if (fs.existsSync(parent2026)) {
          fs.rmdirSync(parent2026);
        }
      } catch {}
    });
  });

  it('should return false when deleting a non-existent file', () => {
    const success = FileStorage.deleteFile('/uploads/documents/does-not-exist.txt');
    expect(success).toBe(false);
  });

  it('should delete an existing file and return true', async () => {
    const mockFile = new File(['delete me'], 'trash.txt', { type: 'text/plain' });
    const info = await FileStorage.saveFile(mockFile);

    // Pastikan file terbuat
    expect(FileStorage.getFileStats(info.path)).not.toBeNull();

    // Hapus file
    const success = FileStorage.deleteFile(info.path);
    expect(success).toBe(true);

    // Pastikan stats mengembalikan null setelah dihapus
    expect(FileStorage.getFileStats(info.path)).toBeNull();
  });
});
