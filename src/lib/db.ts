import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { initializeSchema } from './schema';

const dbPath = path.join(process.cwd(), 'data/projects.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize schema and migrations
initializeSchema(db);

export interface Project {
  uid: string;
  id_ihld: string;
  batch_program: string;
  nama_lop: string;
  region: string;
  status: string;
  sub_status: string;
  full_data: string;
  last_changed_at: string;
  history: string;
}

// --- Prepared Statements ---

export const getProjectByUid = db.prepare('SELECT * FROM projects WHERE uid = ?');
export const getAllProjects = db.prepare('SELECT * FROM projects WHERE region = ? ORDER BY last_changed_at DESC');

export const upsertProject = db.prepare(`
  INSERT INTO projects (
    uid, id_ihld, batch_program, nama_lop, region, status, sub_status, full_data, last_changed_at, history
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
  ON CONFLICT(uid) DO UPDATE SET
    id_ihld = excluded.id_ihld,
    batch_program = excluded.batch_program,
    nama_lop = excluded.nama_lop,
    region = excluded.region,
    status = excluded.status,
    sub_status = excluded.sub_status,
    full_data = excluded.full_data,
    last_changed_at = CASE 
      WHEN projects.sub_status != excluded.sub_status OR projects.status != excluded.status 
      THEN CURRENT_TIMESTAMP 
      ELSE projects.last_changed_at 
    END,
    history = excluded.history
`);

export function getProjectsForSelect() {
  return db.prepare("SELECT DISTINCT nama_lop, id_ihld FROM projects WHERE nama_lop IS NOT NULL AND nama_lop != '' ORDER BY nama_lop ASC").all() as { nama_lop: string; id_ihld: string }[];
}

export default db;
