const db = require('better-sqlite3')(require('path').join(process.cwd(), 'data/projects.db'));
db.pragma('journal_mode = WAL');

// Hapus entri duplikat di history berdasarkan timestamp sinkronasi ke-2 yang diketahui
// Sinkronasi false-positive terjadi sekitar 2026-04-28T01:33:xx.xxxZ
// Entri legitimate adalah yang pertama (sinkronasi ke-1 di 2026-04-28T01:32:xx.xxxZ)

const rows = db.prepare("SELECT id_ihld, history FROM projects WHERE history != '[]'").all();
let fixedCount = 0;

for (const row of rows) {
  const history = JSON.parse(row.history);
  
  // Deduplikasi: hapus entri yang identical (same status + sub_status + duration)
  // yang muncul lebih dari sekali, simpan hanya yang pertama
  const seen = new Set();
  const deduped = history.filter(h => {
    const key = `${h.status}|${h.sub_status}`;
    if (seen.has(key)) {
      console.log(`  Removing duplicate: ${h.status} | ${h.sub_status} | ${h.duration_minutes}mnt @ ${h.ended_at}`);
      return false;
    }
    seen.add(key);
    return true;
  });

  if (deduped.length !== history.length) {
    console.log(`\nID: ${row.id_ihld} - removed ${history.length - deduped.length} duplicate(s)`);
    db.prepare("UPDATE projects SET history = ? WHERE id_ihld = ?").run(
      JSON.stringify(deduped),
      row.id_ihld
    );
    fixedCount++;
  }
}

console.log(`\nTotal rows yang diperbaiki: ${fixedCount}`);

// Final check
const remaining = db.prepare("SELECT id_ihld, history FROM projects WHERE history != '[]'").all();
console.log(`\n=== FINAL STATE ===`);
for (const row of remaining) {
  const history = JSON.parse(row.history);
  console.log(`\nID: ${row.id_ihld}`);
  history.forEach((h, i) => {
    console.log(`  [${i+1}] ${h.status} | ${h.sub_status} | ${h.duration_minutes}mnt | ${h.ended_at}`);
  });
}

db.close();
