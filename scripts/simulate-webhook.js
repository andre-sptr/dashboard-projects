/**
 * Simulasi penuh proses webhook untuk 1 project AANWIJZING.
 * Ini mereproduksi tepat logika yang sama dengan route.ts
 * agar kita bisa lihat step-by-step mengapa history ditambahkan.
 */
const Database = require('better-sqlite3');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const db = new Database(path.join(process.cwd(), 'data/projects.db'));
db.pragma('journal_mode = WAL');

const xlsxPath = path.join(process.cwd(), 'data/latest.xlsx');
const workbook = XLSX.read(fs.readFileSync(xlsxPath), { type: 'buffer' });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const json = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 3 });

// Fungsi normalizeStatus sama persis dengan route.ts
function normalizeStatus(value) {
  return value
    .replace(/[\u00A0\u200B\u200C\u200D\uFEFF\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const getProjectById = db.prepare('SELECT * FROM projects WHERE id_ihld = ?');

// Ambil 3 project AANWIJZING untuk disimulasi
const testIds = db.prepare(
  "SELECT id_ihld FROM projects WHERE status LIKE '%AANWIJZING%' LIMIT 3"
).all().map(r => r.id_ihld);

// Build row dari Excel
const excelRows = [];
for (const row of json) {
  if (!Array.isArray(row) || row.length < 16) continue;
  const region = (row[6] ?? '').toString().trim();
  if (region !== 'SUMBAGTENG') continue;
  const id = (row[1] ?? '').toString().trim();
  if (!id || !testIds.includes(id)) continue;
  excelRows.push({
    id_ihld: id,
    status: (row[14] ?? '').toString().trim(),
    sub_status: (row[15] ?? '').toString().trim(),
  });
}

console.log(`\nSimulasi webhook untuk ${excelRows.length} project AANWIJZING\n`);
console.log('='.repeat(70));

for (const row of excelRows) {
  console.log(`\n>>> Project ID: ${row.id_ihld}`);
  
  const existing = getProjectById.get(row.id_ihld);
  
  console.log(`    existing found: ${!!existing}`);
  if (!existing) { console.log('    -> SKIP (tidak ada di DB)'); continue; }

  const prevStatus = normalizeStatus(existing.status);
  const prevSubStatus = normalizeStatus(existing.sub_status);
  const newStatus = normalizeStatus(row.status);
  const newSubStatus = normalizeStatus(row.sub_status);

  console.log(`    DB status     : [${existing.status}]`);
  console.log(`    Excel status  : [${row.status}]`);
  console.log(`    Normalized DB : [${prevStatus}]`);
  console.log(`    Normalized XL : [${newStatus}]`);
  console.log(`    Status changed: ${prevStatus !== newStatus || prevSubStatus !== newSubStatus}`);
  console.log(`    DB sub_status : [${existing.sub_status}]`);
  console.log(`    Excel sub_st  : [${row.sub_status}]`);
  console.log(`    Sub changed   : ${prevSubStatus !== newSubStatus}`);

  let history = [];
  try {
    const parsed = JSON.parse(existing.history || '[]');
    history = Array.isArray(parsed) ? parsed : [];
  } catch { history = []; }
  
  console.log(`    Current history length: ${history.length}`);

  if (prevStatus !== newStatus || prevSubStatus !== newSubStatus) {
    const lastEntry = history[history.length - 1];
    const isDuplicate = lastEntry &&
      normalizeStatus(lastEntry.status) === prevStatus &&
      normalizeStatus(lastEntry.sub_status) === prevSubStatus;

    console.log(`    lastEntry: ${lastEntry ? JSON.stringify(lastEntry) : 'none'}`);
    console.log(`    isDuplicate: ${isDuplicate}`);
    
    if (!isDuplicate) {
      console.log(`    *** AKAN MENAMBAH HISTORY! ***`);
      console.log(`    Entry yg akan ditambah: { status: "${existing.status}", sub_status: "${existing.sub_status}" }`);
    } else {
      console.log(`    OK - Duplikat, tidak akan ditambahkan`);
    }
  } else {
    console.log(`    OK - Tidak ada perubahan, history tidak bertambah`);
  }
}

console.log('\n' + '='.repeat(70));
db.close();
