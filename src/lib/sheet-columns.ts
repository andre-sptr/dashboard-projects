// Mapping of Google Sheets column positions (0-based) to named fields.
// Spreadsheet headers are at row 2, data starts at row 4.
//
// These values are only DEFAULTS / seed values. The live mapping is stored in
// the `column_config` table and is editable from Settings → Konfigurasi Kolom.
// Read the runtime map via ColumnConfigRepository.getMap() (server) or thread it
// as a prop to client components — do NOT assume COL matches the sheet at runtime.
export const COL = {
  TAHUN: 0,
  ID_IHLD: 1,
  NAMA_LOP: 2,
  REGIONAL: 3,
  AREA: 4,
  STO: 5,
  REGION_FMC: 6,
  BRANCH_FMC: 7,
  BATCH_PROGRAM: 8,
  ODP_PLAN: 9,
  PORT_PLAN: 10,
  CPP: 11,
  BOQ: 12,
  MITRA: 13,
  STATUS: 14,
  SUB_STATUS_KONS: 15,
  DETAIL_STATUS: 16,
  KOMITMEN_GOLIVE: 17,
  TARGET_GOLIVE_APRIL: 18,
  PRIORITAS_1_TSEL: 19,
  PID_PROACTIVE: 20,
  KET: 21,
  WASPANG: 22,
  PROJECT_ADMIN: 23,
  STATUS_GOLIVE: 24,
  KENDALA_GOLIVE: 25,
  PROGRES_MINOL: 26,
  REAL_JML_ODP_8: 27,
  REAL_JML_ODP_16: 28,
  ID_SW_ABD: 29,
  REAL_JML_PORT_GOLIVE: 30,
  TANGGAL_GOLIVE: 31,
  NILAI_PRELIM: 32,
  NILAI_BOQ_QE: 33,
  BOQ_AANWIJZING: 34,
  ODP_AANWIJZING: 35,
} as const;

export type ColKey = keyof typeof COL;

// Runtime column map: every field key resolved to a 0-based column index.
export type ColumnMap = Record<ColKey, number>;

export const DEFAULT_COLUMN_MAP: ColumnMap = { ...COL };

// Field metadata used to seed the config table and render the config UI.
// `label`   — human-readable name shown in the UI.
// `headerText` — text expected in the sheet header row (row 2); used by the
//                "auto-detect from header" feature to resolve the column index.
export interface ColumnFieldMeta {
  key: ColKey;
  label: string;
  headerText: string;
  defaultIndex: number;
}

export interface ColumnConfigEntry {
  field_key: ColKey;
  label: string;
  header_text: string;
  col_index: number;
  sort_order: number;
}

export const COLUMN_FIELDS: ColumnFieldMeta[] = [
  { key: 'TAHUN', label: 'Tahun', headerText: 'TAHUN', defaultIndex: 0 },
  { key: 'ID_IHLD', label: 'ID IHLD', headerText: 'ID-IHLD', defaultIndex: 1 },
  { key: 'NAMA_LOP', label: 'Nama LOP', headerText: 'NAMA LOP', defaultIndex: 2 },
  { key: 'REGIONAL', label: 'Regional', headerText: 'REGIONAL', defaultIndex: 3 },
  { key: 'AREA', label: 'Area', headerText: 'AREA', defaultIndex: 4 },
  { key: 'STO', label: 'STO', headerText: 'STO', defaultIndex: 5 },
  { key: 'REGION_FMC', label: 'Region FMC', headerText: 'REGION FMC', defaultIndex: 6 },
  { key: 'BRANCH_FMC', label: 'Branch FMC', headerText: 'BRANCH FMC', defaultIndex: 7 },
  { key: 'BATCH_PROGRAM', label: 'Batch Program', headerText: 'BATCH PROGRAM', defaultIndex: 8 },
  { key: 'ODP_PLAN', label: 'ODP Plan', headerText: 'ODP PLAN', defaultIndex: 9 },
  { key: 'PORT_PLAN', label: 'Port Plan', headerText: 'PORT PLAN', defaultIndex: 10 },
  { key: 'CPP', label: 'CPP', headerText: 'CPP', defaultIndex: 11 },
  { key: 'BOQ', label: 'BoQ', headerText: 'BOQ', defaultIndex: 12 },
  { key: 'MITRA', label: 'Mitra', headerText: 'Mitra', defaultIndex: 13 },
  { key: 'STATUS', label: 'Status', headerText: 'Status', defaultIndex: 14 },
  { key: 'SUB_STATUS_KONS', label: 'Sub Status Konstruksi', headerText: 'SUB STATUS KONS', defaultIndex: 15 },
  { key: 'DETAIL_STATUS', label: 'Detail Status', headerText: 'DETAIL STATUS', defaultIndex: 16 },
  { key: 'KOMITMEN_GOLIVE', label: 'Komitmen Golive', headerText: 'KOMITMEN GOLIVE', defaultIndex: 17 },
  { key: 'TARGET_GOLIVE_APRIL', label: 'Target Golive April', headerText: 'TARGET GOLIVE APRIL', defaultIndex: 18 },
  { key: 'PRIORITAS_1_TSEL', label: 'Prioritas 1 by Tsel', headerText: 'Prioritas 1 by Tsel', defaultIndex: 19 },
  { key: 'PID_PROACTIVE', label: 'PID (Proactive)', headerText: 'PID (Proactive)', defaultIndex: 20 },
  { key: 'KET', label: 'Keterangan', headerText: 'KET', defaultIndex: 21 },
  { key: 'WASPANG', label: 'Waspang', headerText: 'WASPANG', defaultIndex: 22 },
  { key: 'PROJECT_ADMIN', label: 'Project Admin', headerText: 'PROJECT ADMIN', defaultIndex: 23 },
  { key: 'STATUS_GOLIVE', label: 'Status Golive', headerText: 'STATUS GOLIVE', defaultIndex: 24 },
  { key: 'KENDALA_GOLIVE', label: 'Kendala Golive', headerText: 'KENDALA GOLIVE', defaultIndex: 25 },
  { key: 'PROGRES_MINOL', label: 'Progres MINOL', headerText: 'Progres MINOL', defaultIndex: 26 },
  { key: 'REAL_JML_ODP_8', label: 'Realisasi Jumlah ODP 8', headerText: 'REAL JML ODP 8', defaultIndex: 27 },
  { key: 'REAL_JML_ODP_16', label: 'Realisasi Jumlah ODP 16', headerText: 'REAL JML ODP 16', defaultIndex: 28 },
  { key: 'ID_SW_ABD', label: 'ID SW ABD', headerText: 'ID SW ABD', defaultIndex: 29 },
  { key: 'REAL_JML_PORT_GOLIVE', label: 'Realisasi Jumlah Port Golive', headerText: 'REAL JML PORT GOLIVE', defaultIndex: 30 },
  { key: 'TANGGAL_GOLIVE', label: 'Tanggal Golive', headerText: 'TANGGAL GOLIVE', defaultIndex: 31 },
  { key: 'NILAI_PRELIM', label: 'Nilai PRELIM', headerText: 'Nilai PRELIM', defaultIndex: 32 },
  { key: 'NILAI_BOQ_QE', label: 'Nilai BOQ QE', headerText: 'Nilai BOQ QE', defaultIndex: 33 },
  { key: 'BOQ_AANWIJZING', label: 'BOQ Aanwijzing', headerText: 'BOQ Aandwidjzing', defaultIndex: 34 },
  { key: 'ODP_AANWIJZING', label: 'ODP Aanwijzing', headerText: 'ODP Aandwidjzing', defaultIndex: 35 },
];

// Convert a 0-based column index to a spreadsheet column letter (0 → A, 26 → AA).
export function indexToLetter(index: number): string {
  let n = index;
  let letter = '';
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

// Convert a spreadsheet column letter to a 0-based index (A → 0, AA → 26).
// Returns -1 for invalid input.
export function letterToIndex(letter: string): number {
  const trimmed = letter.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(trimmed)) return -1;
  let index = 0;
  for (const ch of trimmed) {
    index = index * 26 + (ch.charCodeAt(0) - 64);
  }
  return index - 1;
}

// Normalize header / field text for fuzzy matching (auto-detect).
export function normalizeHeader(value: string): string {
  return value
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}
