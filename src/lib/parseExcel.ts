import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { getSpreadsheetId, getSheetId } from './env';

const dataDir = path.join(process.cwd(), 'data');
const xlsxPath = path.join(dataDir, 'latest.xlsx');

export interface ExcelRow {
  uid: string;
  id_ihld: string;
  batch_program: string;
  nama_lop: string;
  region: string;
  status: string;
  sub_status: string;
  full_data: string;
  rowIndex: number;
}

export async function downloadAndParseExcel(): Promise<ExcelRow[]> {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Get validated environment variables
  const SPREADSHEET_ID = getSpreadsheetId();
  const SHEET_ID = getSheetId();

  const EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx&gid=${SHEET_ID}`;

  try {
    const response = await fetch(EXPORT_URL);
    if (!response.ok) {
      throw new Error(`Gagal mengunduh file Excel: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(xlsxPath, Buffer.from(buffer));

    const workbook = XLSX.read(buffer, { type: 'array' });
    if (!workbook.SheetNames.length) {
      throw new Error('File Excel tidak memiliki sheet yang valid.');
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName]!;
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 3 }) as unknown[][];

    const rows: ExcelRow[] = [];

    for (let i = 0; i < json.length; i++) {
      const row = Array.isArray(json[i]) ? json[i] : [];
      if (row.length < 16) continue;

      const region = (row[6] ?? '').toString().trim();
      if (region !== 'SUMBAGTENG') continue;

      const fullDataAtoAF = Array.from({ length: 32 }, (_, idx) => {
        const value = row[idx];
        return value === undefined || value === null ? '' : value;
      });

      const id_ihld = (row[1] ?? '').toString().trim();
      const batch_program = (row[8] ?? '').toString().trim();
      const uid = `${id_ihld}::${batch_program}`;

      rows.push({
        uid,
        id_ihld,
        batch_program,
        nama_lop: (row[2] ?? '').toString().trim(),
        region,
        status: (row[14] ?? '').toString().trim(),
        sub_status: (row[15] ?? '').toString().trim(),
        full_data: JSON.stringify(fullDataAtoAF),
        rowIndex: i + 4,
      });
    }

    const deduplicatedMap = new Map<string, ExcelRow>();
    for (const row of rows) {
      const existing = deduplicatedMap.get(row.uid);
      if (!existing || row.rowIndex > existing.rowIndex) {
        deduplicatedMap.set(row.uid, row);
      }
    }

    const duplicateCount = rows.length - deduplicatedMap.size;
    if (duplicateCount > 0) {
      console.warn(`[parseExcel] Ditemukan ${duplicateCount} baris duplikat (uid ganda). Hanya baris terakhir yang dipakai.`);
    }

    return Array.from(deduplicatedMap.values()).filter((row) => row.id_ihld);
  } catch (error) {
    console.error('Terjadi kesalahan saat memproses Excel:', error);
    throw error;
  }
}
