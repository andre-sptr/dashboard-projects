import db, { Project } from './db';

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

export const getAllUT = db.prepare('SELECT * FROM ut ORDER BY created_at DESC');
export const getUTById = db.prepare('SELECT * FROM ut WHERE id = ?');
export const deleteUTById = db.prepare('DELETE FROM ut WHERE id = ?');

export const upsertUT = db.prepare(`
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

export function getProjectsForUTSelect() {
  const projects = db.prepare("SELECT DISTINCT nama_lop, id_ihld FROM projects WHERE nama_lop IS NOT NULL AND nama_lop != '' ORDER BY nama_lop ASC").all() as { nama_lop: string; id_ihld: string }[];
  return projects;
}