import { AuditLogRepository } from '@/repositories/AuditLogRepository';

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
      console.error('[AuditLogger] Failed to log action:', error);
    }
  }
}
