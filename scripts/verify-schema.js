const db = require('better-sqlite3')(require('path').join(process.cwd(), 'data/projects.db'));

// Cek schema
console.log('\n=== SCHEMA ===');
const info = db.pragma('table_info(projects)');
info.forEach(col => console.log(`  ${col.name} (${col.type}) pk=${col.pk}`));

// Cek total records
const total = db.prepare('SELECT COUNT(*) as c FROM projects').get().c;
console.log(`\nTotal records: ${total}`);

// Cek uid contoh (dua baris dengan id_ihld sama tapi batch beda)
const dupes = db.prepare(`
  SELECT id_ihld, COUNT(*) as cnt FROM projects GROUP BY id_ihld HAVING cnt > 1 LIMIT 5
`).all();

if (dupes.length > 0) {
  console.log('\n=== ID IHLD yang muncul di lebih dari 1 batch ===');
  for (const d of dupes) {
    console.log(`\n  ID: ${d.id_ihld} (${d.cnt} records)`);
    const rows = db.prepare('SELECT uid, batch_program, status, sub_status FROM projects WHERE id_ihld = ?').all(d.id_ihld);
    rows.forEach(r => console.log(`    uid: ${r.uid} | batch: ${r.batch_program} | ${r.status} | ${r.sub_status}`));
  }
} else {
  console.log('\nTidak ada id_ihld yang duplikat (semua batch unik).');
}

// Cek apakah ada history yang tidak diinginkan setelah sync pertama
const withHistory = db.prepare("SELECT COUNT(*) as c FROM projects WHERE history != '[]'").get().c;
console.log(`\nRows dengan history: ${withHistory} (seharusnya 0 untuk sync pertama)`);

db.close();
