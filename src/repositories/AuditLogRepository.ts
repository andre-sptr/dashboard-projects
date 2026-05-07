import { db } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: string;
  new_value: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export class AuditLogRepository {
  static create(data: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const id = uuidv4();
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO audit_logs (
        id, user_id, action, entity_type, entity_id, 
        old_value, new_value, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.user_id, data.action, data.entity_type, data.entity_id,
      data.old_value, data.new_value, data.ip_address || '', data.user_agent || '', created_at
    );

    return { ...data, id, created_at };
  }

  static getByEntity(entityType: string, entityId: string): AuditLog[] {
    return db.prepare(`
      SELECT * FROM audit_logs 
      WHERE entity_type = ? AND entity_id = ? 
      ORDER BY created_at DESC
    `).all(entityType, entityId) as AuditLog[];
  }

  static getRecent(limit: number = 50): AuditLog[] {
    return db.prepare(`
      SELECT * FROM audit_logs 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit) as AuditLog[];
  }

  static getRecentLogs(limit: number = 50, offset: number = 0, entityId?: string): AuditLog[] {
    let query = 'SELECT * FROM audit_logs';
    const params: unknown[] = [];

    if (entityId) {
      query += ' WHERE entity_id = ?';
      params.push(entityId);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(query).all(...params) as AuditLog[];
  }
}
