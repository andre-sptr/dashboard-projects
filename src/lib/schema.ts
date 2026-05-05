import { Database } from 'better-sqlite3';
import { runMigrations } from './migrations';

export function initializeSchema(db: Database) {
  runMigrations(db);
}
