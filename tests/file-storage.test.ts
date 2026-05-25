import { describe, it, expect } from 'vitest';
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
