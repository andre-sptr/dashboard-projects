import { AuditLogRepository } from '@/repositories/AuditLogRepository';
import fs from 'fs';
import path from 'path';

export class AuditLogger {
  static async log(
    userId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC' | 'UPLOAD',
    entityType: string,
    entityId: string,
    oldValue: unknown = {},
    newValue: unknown = {}
  ) {
    try {
      AuditLogRepository.create({
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_value: JSON.stringify(oldValue),
        new_value: JSON.stringify(newValue)
      });
    } catch (error) {
      console.error('[AuditLogger] Failed to write to DB audit log. Writing to fallback log file:', error);
      try {
        const fallbackDir = path.join(process.cwd(), 'data', 'logs');
        if (!fs.existsSync(fallbackDir)) {
          fs.mkdirSync(fallbackDir, { recursive: true });
        }
        const fallbackFile = path.join(fallbackDir, 'audit_fallback.log');
        const logEntry = {
          timestamp: new Date().toISOString(),
          user_id: userId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          old_value: oldValue,
          new_value: newValue
        };
        fs.appendFileSync(fallbackFile, JSON.stringify(logEntry) + '\n', 'utf8');
      } catch (fallbackError) {
        console.error('[AuditLogger] CRITICAL: Fallback audit logging also failed:', fallbackError);
      }
    }
  }
}
