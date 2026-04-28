/**
 * Script debugging mendalam: membandingkan karakter per karakter
 * antara nilai di DB vs nilai dari Excel untuk project AANWIJZING.
 * Jalankan SETELAH melakukan sinkronasi untuk melihat penyebab bug.
 */
const Database = require('better-sqlite3');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const db = new Database(path.join(process.cwd(), 'data/projects.db'));
const xlsxPath = path.join(process.cwd(), 'data/latest.xlsx');

if (!fs.existsSync(xlsxPath)) {
  console.error('File latest.xlsx tidak ditemukan! Jalankan sinkronasi dulu.');
  process.exit(1);
}

// Baca Excel
const workbook = XLSX.read(fs.readFileSync(xlsxPath), { type: 'buffer' });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const json = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 3 });

// Bangun map dari Excel: id_ihld -> { status, sub_status }
const excelMap = new Map();
for (const row of json) {
  if (!Array.isArray(row) || row.length < 16) continue;
  const region = (row[6] ?? '').toString().trim();
  if (region !== 'SUMBAGTENG') continue;
  const id = (row[1] ?? '').toString().trim();
  if (!id) continue;
  excelMap.set(id, {
    status: (row[14] ?? '').toString().trim(),
    sub_status: (row[15] ?? '').toString().trim(),
  });
}

// Bandingkan dengan DB untuk rows AANWIJZING
const dbRows = db.prepare(
  "SELECT id_ihld, status, sub_status FROM projects WHERE status LIKE '%AANWIJZING%' LIMIT 5"
).all();

console.log(`\nMembandingkan ${dbRows.length} rows AANWIJZING...\n`);
console.log('='.repeat(70));

function toCharCodes(str) {
  return Array.from(str).map(c => `${c}(U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0')})`).join(' ');
}

let mismatchCount = 0;

for (const dbRow of dbRows) {
  const excel = excelMap.get(dbRow.id_ihld);
  if (!excel) {
    console.log(`\nID: ${dbRow.id_ihld} -> TIDAK ADA DI EXCEL`);
    continue;
  }

  const statusMatch = dbRow.status === excel.status;
  const subMatch = dbRow.sub_status === excel.sub_status;

  console.log(`\nID: ${dbRow.id_ihld}`);
  console.log(`  STATUS MATCH: ${statusMatch ? '✅ SAMA' : '❌ BEDA'}`);
  console.log(`  DB    : [${dbRow.status}] (len=${dbRow.status.length})`);
  console.log(`  EXCEL : [${excel.status}] (len=${excel.status.length})`);
  if (!statusMatch) {
    console.log(`  DB chars   : ${toCharCodes(dbRow.status)}`);
    console.log(`  Excel chars: ${toCharCodes(excel.status)}`);
    mismatchCount++;
  }

  console.log(`  SUB_STATUS MATCH: ${subMatch ? '✅ SAMA' : '❌ BEDA'}`);
  console.log(`  DB    : [${dbRow.sub_status}] (len=${dbRow.sub_status.length})`);
  console.log(`  EXCEL : [${excel.sub_status}] (len=${excel.sub_status.length})`);
  if (!subMatch) {
    console.log(`  DB chars   : ${toCharCodes(dbRow.sub_status)}`);
    console.log(`  Excel chars: ${toCharCodes(excel.sub_status)}`);
    mismatchCount++;
  }
}

console.log('\n' + '='.repeat(70));
console.log(`Total mismatch ditemukan: ${mismatchCount}`);
if (mismatchCount === 0) {
  console.log('\n>>> Semua string IDENTIK! Bug mungkin di logika lain (bukan string compare).');
  console.log('>>> Coba cek: apakah status di DB sudah ter-update ke nilai baru dari Excel?');
}

db.close();
