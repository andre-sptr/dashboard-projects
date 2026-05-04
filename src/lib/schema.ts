import { Database } from 'better-sqlite3';

export function initializeSchema(db: Database) {
  // --- Projects Table ---
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

  // --- Projects Migrations ---
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

  // --- Other Tables ---
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

  // --- boq_aanwijzing Migrations ---
  const boqAanwijzingTableInfo = db.pragma('table_info(boq_aanwijzing)') as { name: string }[];
  const boqAanwijzingColumns = boqAanwijzingTableInfo.map((c) => c.name);

  if (boqAanwijzingColumns.includes('boq_items') && !boqAanwijzingColumns.includes('full_data')) {
    db.exec(`ALTER TABLE boq_aanwijzing RENAME COLUMN boq_items TO full_data`);
  } else if (!boqAanwijzingColumns.includes('full_data')) {
    db.exec(`ALTER TABLE boq_aanwijzing ADD COLUMN full_data TEXT DEFAULT '[]'`);
  }
}
