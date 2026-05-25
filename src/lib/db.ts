import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initializeSchema } from './schema';
import { getDatabasePath } from './env';

export type { Document, Project, SyncLog } from '@/types/database';

function resolveDatabasePath(configuredPath: string): string {
  if (path.isAbsolute(configuredPath)) {
    return configuredPath;
  }

  const normalizedPath = configuredPath.replace(/^[./\\]+/, '').replace(/\\/g, '/');
  if (normalizedPath === 'data/projects.db') {
    return path.join(process.cwd(), 'data', 'projects.db');
  }

  return path.join(/* turbopackIgnore: true */ process.cwd(), configuredPath);
}

let _dbInstance: Database.Database | null = null;

function getDbInstance(): Database.Database {
  if (!_dbInstance) {
    const dbPath = resolveDatabasePath(getDatabasePath());
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const instance = new Database(dbPath);
    instance.pragma('journal_mode = WAL');
    instance.pragma('foreign_keys = ON');

    initializeSchema(instance);
    _dbInstance = instance;
  }
  return _dbInstance;
}

// Export a Proxy that intercepts all access and forwards to the lazily loaded database instance
export const db = new Proxy({} as Database.Database, {
  get(target, prop, receiver) {
    const instance = getDbInstance();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
  set(target, prop, value, receiver) {
    const instance = getDbInstance();
    return Reflect.set(instance, prop, value, receiver);
  }
});

