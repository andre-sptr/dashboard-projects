import { db } from '../lib/db';

export interface Boq {
  id: string;
  nama_lop: string;
  id_ihld: string;
  sto: string;
  batch_program: string;
  project_name: string;
  region: string;
  full_data: string;
  created_at: string;
  updated_at: string;
}

// Repository for Bill of Quantity (BoQ) records
export class BoqRepository {
  // Get all BoQ records
  static findAll(): Boq[] {
    return db.prepare('SELECT * FROM boq ORDER BY created_at DESC').all() as Boq[];
  }

  // Find BoQ by ID
  static findById(id: string): Boq | undefined {
    return db.prepare('SELECT * FROM boq WHERE id = ?').get(id) as Boq | undefined;
  }

  // Delete BoQ by ID
  static delete(id: string) {
    return db.prepare('DELETE FROM boq WHERE id = ?').run(id);
  }

  // Insert or update BoQ
  static upsert(data: Omit<Boq, 'created_at' | 'updated_at'>) {
    const stmt = db.prepare(`
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

    return stmt.run(
      data.id,
      data.nama_lop,
      data.id_ihld,
      data.sto,
      data.batch_program,
      data.project_name,
      data.region,
      data.full_data
    );
  }
}
