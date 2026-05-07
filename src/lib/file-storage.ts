import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
   * Save a file from a Buffer or ReadableStream
   */
  static async saveFile(file: File, subfolder: string = ''): Promise<FileInfo> {
    const targetDir = subfolder ? path.join(UPLOAD_DIR, subfolder) : UPLOAD_DIR;
    
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
      const fullPath = path.join(process.cwd(), 'public', relativeFilePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error deleting file ${relativeFilePath}:`, error);
      return false;
    }
  }

  /**
   * Get file stats
   */
  static getFileStats(relativeFilePath: string) {
    try {
      const fullPath = path.join(process.cwd(), 'public', relativeFilePath);
      if (fs.existsSync(fullPath)) {
        return fs.statSync(fullPath);
      }
      return null;
    } catch {
      return null;
    }
  }
}
