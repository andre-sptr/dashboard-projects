import { db } from '../lib/db';

export interface UT {
  id: string;
  nama_lop: string;
  id_ihld: string;
  witel: string;
  tematik: string;
  sto: string;
  tim_ut: string;
  commtest_ut: string;
  jumlah_odp: number;
  jumlah_port: number;
  tanggal_ct_ut: string;
  temuan: string;
  follow_up_mitra: number;
  mitra: string;
  jumlah_temuan: number;
  wa_spang: string;
  komitmen_penyelesaian: string;
  created_at: string;
  updated_at: string;
}

export interface BoqUt {
  id: string;
  ut_id: string;
  nama_lop: string;
  id_ihld: string;
  full_data: string;
  created_at: string;
  updated_at: string;
}

// Repository for Uji Terima (UT) records
export class UtRepository {
  // Get all UT records
  static findAll(): UT[] {
    return db.prepare('SELECT * FROM ut ORDER BY created_at DESC').all() as UT[];
  }

  // Find UT by ID
  static findById(id: string): UT | undefined {
    return db.prepare('SELECT * FROM ut WHERE id = ?').get(id) as UT | undefined;
  }

  // Delete UT by ID
  static delete(id: string) {
    return db.prepare('DELETE FROM ut WHERE id = ?').run(id);
  }

  // Insert or update UT
  static upsert(data: Omit<UT, 'created_at' | 'updated_at'>) {
    const stmt = db.prepare(`
      INSERT INTO ut (
        id, nama_lop, id_ihld, witel, tematik, sto, tim_ut, commtest_ut,
        jumlah_odp, jumlah_port, tanggal_ct_ut, temuan, follow_up_mitra,
        mitra, jumlah_temuan, wa_spang, komitmen_penyelesaian, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        nama_lop = excluded.nama_lop,
        id_ihld = excluded.id_ihld,
        witel = excluded.witel,
        tematik = excluded.tematik,
        sto = excluded.sto,
        tim_ut = excluded.tim_ut,
        commtest_ut = excluded.commtest_ut,
        jumlah_odp = excluded.jumlah_odp,
        jumlah_port = excluded.jumlah_port,
        tanggal_ct_ut = excluded.tanggal_ct_ut,
        temuan = excluded.temuan,
        follow_up_mitra = excluded.follow_up_mitra,
        mitra = excluded.mitra,
        jumlah_temuan = excluded.jumlah_temuan,
        wa_spang = excluded.wa_spang,
        komitmen_penyelesaian = excluded.komitmen_penyelesaian,
        updated_at = CURRENT_TIMESTAMP
    `);

    return stmt.run(
      data.id,
      data.nama_lop,
      data.id_ihld,
      data.witel,
      data.tematik,
      data.sto,
      data.tim_ut,
      data.commtest_ut,
      data.jumlah_odp,
      data.jumlah_port,
      data.tanggal_ct_ut,
      data.temuan,
      data.follow_up_mitra,
      data.mitra,
      data.jumlah_temuan,
      data.wa_spang,
      data.komitmen_penyelesaian
    );
  }

  // Get BoQ data for UT
  static getBoq(utId: string): BoqUt | undefined {
    return db.prepare('SELECT * FROM boq_ut WHERE ut_id = ?').get(utId) as BoqUt | undefined;
  }

  // Insert or update BoQ for UT
  static upsertBoq(data: {
    id: string;
    ut_id: string;
    nama_lop: string;
    id_ihld: string;
    full_data: string;
  }) {
    const stmt = db.prepare(`
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

    return stmt.run(
      data.id,
      data.ut_id,
      data.nama_lop,
      data.id_ihld,
      data.full_data
    );
  }

  // Delete BoQ records for UT
  static deleteBoqByUtId(utId: string) {
    return db.prepare('DELETE FROM boq_ut WHERE ut_id = ?').run(utId);
  }
}
