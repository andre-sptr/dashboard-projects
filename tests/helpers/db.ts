// Database helpers for testing and database initialization
import Database from 'better-sqlite3';
import { initializeSchema } from '@/lib/schema';

export function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  initializeSchema(db);
  return db;
}
