import db, { getProjectsForSelect } from './db';

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
  created_at: string;
  updated_at: string;
}

export const getAllAanwijzing = db.prepare('SELECT * FROM aanwijzing ORDER BY created_at DESC');
export const getAanwijzingById = db.prepare('SELECT * FROM aanwijzing WHERE id = ?');
export const deleteAanwijzingById = db.prepare('DELETE FROM aanwijzing WHERE id = ?');

export const upsertAanwijzing = db.prepare(`
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

export { getProjectsForSelect };