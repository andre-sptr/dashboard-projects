import { db } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_entity_type?: string;
  related_entity_id?: string;
  is_read: number;
  created_at: string;
  read_at?: string;
}

export class NotificationRepository {
  static create(data: Omit<Notification, 'id' | 'is_read' | 'created_at'>): Notification {
    const id = uuidv4();
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO notifications (
        id, user_id, type, title, message, 
        related_entity_type, related_entity_id, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      id, data.user_id, data.type, data.title, data.message,
      data.related_entity_type || null, data.related_entity_id || null, created_at
    );

    return { ...data, id, is_read: 0, created_at };
  }

  static getByUserId(userId: string, limit: number = 20): Notification[] {
    return db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(userId, limit) as Notification[];
  }

  static getUnreadCount(userId: string): number {
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(userId) as { count: number };
    return result.count;
  }

  static markAsRead(id: string) {
    const read_at = new Date().toISOString();
    db.prepare(`
      UPDATE notifications 
      SET is_read = 1, read_at = ? 
      WHERE id = ?
    `).run(read_at, id);
  }

  static markAllAsRead(userId: string) {
    const read_at = new Date().toISOString();
    db.prepare(`
      UPDATE notifications 
      SET is_read = 1, read_at = ? 
      WHERE user_id = ? AND is_read = 0
    `).run(read_at, userId);
  }

  static delete(id: string) {
    db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
  }
}
