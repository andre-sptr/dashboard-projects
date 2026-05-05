import { Database } from 'better-sqlite3';

interface Migration {
  id: number;
  name: string;
  run: (db: Database) => void;
}

const migrations: Migration[] = [
  {
    id: 1,
    name: 'initial_schema',
    run: (db) => {
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
        );
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
        );
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
        );
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
        );
        CREATE TABLE IF NOT EXISTS boq_aanwijzing (
          id TEXT PRIMARY KEY,
          aanwijzing_id TEXT NOT NULL,
          nama_lop TEXT NOT NULL,
          id_ihld TEXT NOT NULL DEFAULT '',
          full_data TEXT DEFAULT '[]',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS boq_ut (
          id TEXT PRIMARY KEY,
          ut_id TEXT NOT NULL,
          nama_lop TEXT NOT NULL,
          id_ihld TEXT NOT NULL DEFAULT '',
          full_data TEXT DEFAULT '[]',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }
  },
  {
    id: 2,
    name: 'fix_boq_aanwijzing_full_data_column',
    run: (db) => {
      const tableInfo = db.pragma('table_info(boq_aanwijzing)') as { name: string }[];
      const columns = tableInfo.map((c) => c.name);

      if (columns.includes('boq_items') && !columns.includes('full_data')) {
        db.exec(`ALTER TABLE boq_aanwijzing RENAME COLUMN boq_items TO full_data`);
      } else if (!columns.includes('full_data')) {
        db.exec(`ALTER TABLE boq_aanwijzing ADD COLUMN full_data TEXT DEFAULT '[]'`);
      }
    }
  },
  {
    id: 3,
    name: 'add_indexes_for_performance',
    run: (db) => {
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_projects_region ON projects(region);
        CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
        CREATE INDEX IF NOT EXISTS idx_projects_last_changed ON projects(last_changed_at);
        CREATE INDEX IF NOT EXISTS idx_aanwijzing_id_ihld ON aanwijzing(id_ihld);
        CREATE INDEX IF NOT EXISTS idx_ut_id_ihld ON ut(id_ihld);
        CREATE INDEX IF NOT EXISTS idx_boq_aanwijzing_aid ON boq_aanwijzing(aanwijzing_id);
        CREATE INDEX IF NOT EXISTS idx_boq_ut_uid ON boq_ut(ut_id);
      `);
    }
  }
];

export function runMigrations(db: Database) {
  // Create migrations table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const appliedMigrations = db.prepare('SELECT id FROM _migrations').all() as { id: number }[];
  const appliedIds = new Set(appliedMigrations.map(m => m.id));

  for (const migration of migrations) {
    if (!appliedIds.has(migration.id)) {
      console.log(`[db] Applying migration ${migration.id}: ${migration.name}`);
      try {
        db.transaction(() => {
          migration.run(db);
          db.prepare('INSERT INTO _migrations (id, name) VALUES (?, ?)').run(migration.id, migration.name);
        })();
      } catch (error) {
        console.error(`[db] Failed to apply migration ${migration.id}:`, error);
        throw error;
      }
    }
  }
}
