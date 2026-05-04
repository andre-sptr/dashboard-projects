import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data/projects.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

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

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    uid TEXT PRIMARY KEY,
    id_ihld TEXT NOT NULL,
    batch_program TEXT NOT NULL DEFAULT '',
    nama_lop TEXT DEFAULT '',
    region TEXT NOT NULL,
    status TEXT NOT NULL,
    sub_status TEXT NOT NULL,
    full_data TEXT DEFAULT '[]',
    last_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    history TEXT DEFAULT '[]'
  )
`);

const tableInfo = db.pragma('table_info(projects)') as { name: string }[];
const columns = tableInfo.map((c) => c.name);

if (!columns.includes('uid')) {
  db.exec(`ALTER TABLE projects ADD COLUMN uid TEXT DEFAULT ''`);
  db.exec(`UPDATE projects SET uid = id_ihld || '::' WHERE uid = ''`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects_new (
      uid TEXT PRIMARY KEY,
      id_ihld TEXT NOT NULL,
      batch_program TEXT NOT NULL DEFAULT '',
      nama_lop TEXT DEFAULT '',
      region TEXT NOT NULL,
      status TEXT NOT NULL,
      sub_status TEXT NOT NULL,
      full_data TEXT DEFAULT '[]',
      last_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      history TEXT DEFAULT '[]'
    );
    INSERT OR IGNORE INTO projects_new
      (uid, id_ihld, batch_program, nama_lop, region, status, sub_status, full_data, last_changed_at, history)
    SELECT uid, id_ihld, '' as batch_program, nama_lop, region, status, sub_status, full_data, last_changed_at, history
    FROM projects;
    DROP TABLE projects;
    ALTER TABLE projects_new RENAME TO projects;
  `);
  console.log('[db] Migrasi schema selesai: uid sekarang menjadi PRIMARY KEY.');
}

if (!columns.includes('batch_program') && columns.includes('uid')) {
  db.exec(`ALTER TABLE projects ADD COLUMN batch_program TEXT NOT NULL DEFAULT ''`);
}
if (!columns.includes('nama_lop')) {
  db.exec(`ALTER TABLE projects ADD COLUMN nama_lop TEXT DEFAULT ''`);
}
if (!columns.includes('full_data')) {
  db.exec(`ALTER TABLE projects ADD COLUMN full_data TEXT DEFAULT '[]'`);
}

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

db.exec(`
  CREATE TABLE IF NOT EXISTS aanwijzing (
    id TEXT PRIMARY KEY,
    nama_lop TEXT NOT NULL,
    id_ihld TEXT NOT NULL,
    tematik TEXT DEFAULT '',
    tanggal_aanwijzing TEXT NOT NULL,
    catatan TEXT DEFAULT '',
    status_after_aanwijzing TEXT DEFAULT '',
    gpon TEXT DEFAULT '',
    frame INTEGER DEFAULT 0,
    slot_awal INTEGER DEFAULT 0,
    slot_akhir INTEGER DEFAULT 0,
    port_awal INTEGER DEFAULT 0,
    port_akhir INTEGER DEFAULT 0,
    wa_spang TEXT DEFAULT '',
    ut TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS ut (
    id TEXT PRIMARY KEY,
    nama_lop TEXT NOT NULL,
    id_ihld TEXT NOT NULL,
    witel TEXT DEFAULT '',
    tematik TEXT DEFAULT '',
    sto TEXT DEFAULT '',
    tim_ut TEXT DEFAULT '',
    commtest_ut TEXT DEFAULT '',
    jumlah_odp INTEGER DEFAULT 0,
    jumlah_port INTEGER DEFAULT 0,
    tanggal_ct_ut TEXT DEFAULT '',
    temuan TEXT DEFAULT '',
    follow_up_mitra INTEGER DEFAULT 0,
    mitra TEXT DEFAULT '',
    jumlah_temuan INTEGER DEFAULT 0,
    wa_spang TEXT DEFAULT '',
    komitmen_penyelesaian TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS boq (
    id TEXT PRIMARY KEY,
    nama_lop TEXT NOT NULL,
    id_ihld TEXT NOT NULL DEFAULT '',
    sto TEXT NOT NULL DEFAULT '',
    batch_program TEXT NOT NULL DEFAULT '',
    project_name TEXT NOT NULL DEFAULT '',
    region TEXT NOT NULL DEFAULT 'SUMBAGTENG',
    full_data TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export const getAllBoq = db.prepare('SELECT * FROM boq ORDER BY created_at DESC');
export const getBoqById = db.prepare('SELECT * FROM boq WHERE id = ?');
export const upsertBoq = db.prepare(`
  INSERT INTO boq (
    id, nama_lop, id_ihld, sto, batch_program, project_name, region, full_data, created_at, updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT(id) DO UPDATE SET
    nama_lop = excluded.nama_lop,
    id_ihld = excluded.id_ihld,
    sto = excluded.sto,
    batch_program = excluded.batch_program,
    project_name = excluded.project_name,
    region = excluded.region,
    full_data = excluded.full_data,
    updated_at = CURRENT_TIMESTAMP
`);
export const deleteBoq = db.prepare('DELETE FROM boq WHERE id = ?');

db.exec(`
  CREATE TABLE IF NOT EXISTS boq_aanwijzing (
    id TEXT PRIMARY KEY,
    aanwijzing_id TEXT NOT NULL,
    nama_lop TEXT NOT NULL,
    id_ihld TEXT NOT NULL DEFAULT '',
    full_data TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const boqAanwijzingTableInfo = db.pragma('table_info(boq_aanwijzing)') as { name: string }[];
const boqAanwijzingColumns = boqAanwijzingTableInfo.map((c) => c.name);

if (boqAanwijzingColumns.includes('boq_items') && !boqAanwijzingColumns.includes('full_data')) {
  db.exec(`ALTER TABLE boq_aanwijzing RENAME COLUMN boq_items TO full_data`);
} else if (!boqAanwijzingColumns.includes('full_data')) {
  db.exec(`ALTER TABLE boq_aanwijzing ADD COLUMN full_data TEXT DEFAULT '[]'`);
}

export const getBoqAanwijzingByAanwijzingId = db.prepare('SELECT * FROM boq_aanwijzing WHERE aanwijzing_id = ?');
export const upsertBoqAanwijzing = db.prepare(`
  INSERT INTO boq_aanwijzing (
    id, aanwijzing_id, nama_lop, id_ihld, full_data, created_at, updated_at
  )
  VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT(id) DO UPDATE SET
    aanwijzing_id = excluded.aanwijzing_id,
    nama_lop = excluded.nama_lop,
    id_ihld = excluded.id_ihld,
    full_data = excluded.full_data,
    updated_at = CURRENT_TIMESTAMP
`);
export const deleteBoqAanwijzingByAanwijzingId = db.prepare('DELETE FROM boq_aanwijzing WHERE aanwijzing_id = ?');

db.exec(`
  CREATE TABLE IF NOT EXISTS boq_ut (
    id TEXT PRIMARY KEY,
    ut_id TEXT NOT NULL,
    nama_lop TEXT NOT NULL,
    id_ihld TEXT NOT NULL DEFAULT '',
    full_data TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export const getBoqUtByUtId = db.prepare('SELECT * FROM boq_ut WHERE ut_id = ?');
export const upsertBoqUt = db.prepare(`
  INSERT INTO boq_ut (
    id, ut_id, nama_lop, id_ihld, full_data, created_at, updated_at
  )
  VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT(id) DO UPDATE SET
    ut_id = excluded.ut_id,
    nama_lop = excluded.nama_lop,
    id_ihld = excluded.id_ihld,
    full_data = excluded.full_data,
    updated_at = CURRENT_TIMESTAMP
`);
export const deleteBoqUtByUtId = db.prepare('DELETE FROM boq_ut WHERE ut_id = ?');

export function getProjectsForSelect() {
  const projects = db.prepare("SELECT DISTINCT nama_lop, id_ihld FROM projects WHERE nama_lop IS NOT NULL AND nama_lop != '' ORDER BY nama_lop ASC").all() as { nama_lop: string; id_ihld: string }[];
  return projects;
}

export default db;
