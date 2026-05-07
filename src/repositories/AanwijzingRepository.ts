import { db } from '../lib/db';

export interface Aanwijzing {
  id: string;
  nama_lop: string;
  id_ihld: string;
  tematik: string;
  tanggal_aanwijzing: string;
  catatan: string;
  status_after_aanwijzing: string;
  gpon: string;
  frame: number;
  slot_awal: number;
  slot_akhir: number;
  port_awal: number;
  port_akhir: number;
  wa_spang: string;
  ut: string;
  updated_at: string;
}

export interface BoqAanwijzing {
  id: string;
  aanwijzing_id: string;
  nama_lop: string;
  id_ihld: string;
  full_data: string;
  created_at: string;
  updated_at: string;
}

// Repository for Aanwijzing (technical briefing) records
export class AanwijzingRepository {
  // Get all aanwijzing records
  static findAll(): Aanwijzing[] {
    return db.prepare('SELECT * FROM aanwijzing ORDER BY created_at DESC').all() as Aanwijzing[];
  }

  // Find aanwijzing by ID
  static findById(id: string): Aanwijzing | undefined {
    return db.prepare('SELECT * FROM aanwijzing WHERE id = ?').get(id) as Aanwijzing | undefined;
  }

  // Delete aanwijzing by ID
  static delete(id: string) {
    return db.prepare('DELETE FROM aanwijzing WHERE id = ?').run(id);
  }

  // Insert or update aanwijzing
  static upsert(data: Omit<Aanwijzing, 'created_at' | 'updated_at'>) {
    const stmt = db.prepare(`
      INSERT INTO aanwijzing (
        id, nama_lop, id_ihld, tematik, tanggal_aanwijzing, catatan,
        status_after_aanwijzing, gpon, frame, slot_awal, slot_akhir,
        port_awal, port_akhir, wa_spang, ut, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        nama_lop = excluded.nama_lop,
        id_ihld = excluded.id_ihld,
        tematik = excluded.tematik,
        tanggal_aanwijzing = excluded.tanggal_aanwijzing,
        catatan = excluded.catatan,
        status_after_aanwijzing = excluded.status_after_aanwijzing,
        gpon = excluded.gpon,
        frame = excluded.frame,
        slot_awal = excluded.slot_awal,
        slot_akhir = excluded.slot_akhir,
        port_awal = excluded.port_awal,
        port_akhir = excluded.port_akhir,
        wa_spang = excluded.wa_spang,
        ut = excluded.ut,
        updated_at = CURRENT_TIMESTAMP
    `);

    return stmt.run(
      data.id,
      data.nama_lop,
      data.id_ihld,
      data.tematik,
      data.tanggal_aanwijzing,
      data.catatan,
      data.status_after_aanwijzing,
      data.gpon,
      data.frame,
      data.slot_awal,
      data.slot_akhir,
      data.port_awal,
      data.port_akhir,
      data.wa_spang,
      data.ut
    );
  }

  // Get BoQ data for aanwijzing
  static getBoq(aanwijzingId: string): BoqAanwijzing | undefined {
    return db.prepare('SELECT * FROM boq_aanwijzing WHERE aanwijzing_id = ?').get(aanwijzingId) as BoqAanwijzing | undefined;
  }

  // Insert or update BoQ for aanwijzing
  static upsertBoq(data: {
    id: string;
    aanwijzing_id: string;
    nama_lop: string;
    id_ihld: string;
    full_data: string;
  }) {
    const stmt = db.prepare(`
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

    return stmt.run(
      data.id,
      data.aanwijzing_id,
      data.nama_lop,
      data.id_ihld,
      data.full_data
    );
  }

  // Delete BoQ records for aanwijzing
  static deleteBoqByAanwijzingId(aanwijzingId: string) {
    return db.prepare('DELETE FROM boq_aanwijzing WHERE aanwijzing_id = ?').run(aanwijzingId);
  }
}
