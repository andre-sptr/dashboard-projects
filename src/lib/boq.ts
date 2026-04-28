import * as XLSX from 'xlsx';

export interface BoqRow {
  id: string;
  nama_lop: string;
  id_ihld: string;
  sto: string;
  batch_program: string;
  project_name: string;
  region: string;
  full_data: string;
  rowIndex: number;
}

export interface BoqResult {
  project_name: string;
  nama_lop: string;
  sto: string;
  rows: BoqRow[];
}

export function parseBoQExcel(buffer: ArrayBuffer): BoqResult {
  const workbook = XLSX.read(buffer, { type: 'array' });

  if (!workbook.SheetNames.length) {
    throw new Error('File Excel tidak memiliki sheet yang valid.');
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName]!;

  const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as unknown[][];

  let projectName = '';
  let namaLop = '';
  let sto = '';

  const a2Value = json[1]?.[0]?.toString() || '';
  if (a2Value.toUpperCase().startsWith('PROJECT : ')) {
    projectName = a2Value.substring(8).trim();
    namaLop = projectName;
  }

  const a3Value = json[2]?.[0]?.toString() || '';
  if (a3Value.toUpperCase().startsWith('STO : ')) {
    sto = a3Value.substring(4).trim();
  }

  const rows: BoqRow[] = [];

  for (let i = 4; i < json.length; i++) {
    const row = Array.isArray(json[i]) ? json[i] : [];

    if (row.length === 0 || !row[0]?.toString().trim()) {
      continue;
    }

    const idIhld = (row[0] || '').toString().trim();

    if (!idIhld) continue;

    const batchProgram = (row[1] || '').toString().trim();

    const uid = `boq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const fullDataArray = Array.from(row, (v) => (v === undefined || v === null ? '' : v));
    const fullData = JSON.stringify(fullDataArray);

    rows.push({
      id: uid,
      nama_lop: namaLop,
      id_ihld: idIhld,
      sto: sto,
      batch_program: batchProgram,
      project_name: projectName,
      region: 'SUMBAGTENG',
      full_data: fullData,
      rowIndex: i + 1,
    });
  }

  return {
    project_name: projectName,
    nama_lop: namaLop,
    sto: sto,
    rows: rows,
  };
}