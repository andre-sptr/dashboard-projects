import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ForbiddenError } from './errors';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'documents');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: string;
}

export class FileStorage {
  /**
   * Helper function to prevent path traversal vulnerability.
   * Resolves path and verifies it stays within the intended base directory.
   */
  private static getSafePath(userPath: string, baseDir: string = UPLOAD_DIR): string {
    if (userPath.includes('\0')) {
      throw new ForbiddenError('Path contains invalid null byte characters');
    }

    const resolvedBase = path.resolve(baseDir);
    
    // Normalize user path by removing leading uploads/documents prefix if present
    let targetSegment = userPath;
    if (targetSegment.startsWith('/uploads/documents/')) {
      targetSegment = targetSegment.substring('/uploads/documents/'.length);
    } else if (targetSegment.startsWith('uploads/documents/')) {
      targetSegment = targetSegment.substring('uploads/documents/'.length);
    } else if (targetSegment.startsWith('/')) {
      targetSegment = targetSegment.substring(1);
    }
    
    const resolvedPath = path.resolve(resolvedBase, targetSegment);
    
    if (!resolvedPath.startsWith(resolvedBase)) {
      throw new ForbiddenError('Access to the requested path is forbidden: Path traversal detected.');
    }
    
    return resolvedPath;
  }

  /**
   * Save a file from a Buffer or ReadableStream
   */
  static async saveFile(file: File, subfolder: string = ''): Promise<FileInfo> {
    const targetDir = subfolder ? FileStorage.getSafePath(subfolder, UPLOAD_DIR) : UPLOAD_DIR;
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fileExtension = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(targetDir, fileName);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Return relative path for storage in DB and access via public URL
    const relativePath = subfolder 
      ? `/uploads/documents/${subfolder}/${fileName}`
      : `/uploads/documents/${fileName}`;

    return {
      name: file.name,
      path: relativePath,
      size: file.size,
      type: file.type
    };
  }

  /**
   * Delete a file from the filesystem
   */
  static deleteFile(relativeFilePath: string): boolean {
    try {
      const fullPath = FileStorage.getSafePath(relativeFilePath, UPLOAD_DIR);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error deleting file ${relativeFilePath}:`, error);
      if (error instanceof ForbiddenError) {
        throw error;
      }
      return false;
    }
  }

  /**
   * Get file stats
   */
  static getFileStats(relativeFilePath: string) {
    try {
      const fullPath = FileStorage.getSafePath(relativeFilePath, UPLOAD_DIR);
      if (fs.existsSync(fullPath)) {
        return fs.statSync(fullPath);
      }
      return null;
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw error;
      }
      return null;
    }
  }
}
