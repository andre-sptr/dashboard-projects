const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(process.cwd(), 'data/projects.db'));
db.pragma('journal_mode = WAL');

// Cek semua rows yang punya history tidak kosong
const rows = db.prepare("SELECT id_ihld, status, sub_status, history FROM projects WHERE history != '[]'").all();
let falsePositiveCount = 0;
let cleanedCount = 0;

const SUSPICIOUS_STATUSES = ['1. AANWIJZING', '2. DONE AANWIJZING'];
const DURATION_THRESHOLD = 5; // menit - entri <= 5 menit dianggap suspicious

console.log(`\nTotal rows dengan history: ${rows.length}`);
console.log('='.repeat(60));

for (const row of rows) {
  try {
    const history = JSON.parse(row.history);
    
    // Filter entri yang dicurigai false-positive:
    // Status AANWIJZING/DONE AANWIJZING dengan durasi sangat kecil (< 5 menit)
    const suspicious = history.filter(h =>
      SUSPICIOUS_STATUSES.includes(h.status) && h.duration_minutes <= DURATION_THRESHOLD
    );

    if (suspicious.length > 0) {
      falsePositiveCount++;
      console.log(`\nID: ${row.id_ihld}`);
      console.log(`  Current Status: ${row.status} | ${row.sub_status}`);
      console.log(`  History entries: ${history.length}, Suspicious: ${suspicious.length}`);
      suspicious.forEach(h => {
        console.log(`  -> [SUSPICIOUS] ${h.status} | ${h.sub_status} | ${h.duration_minutes} mnt | ${h.ended_at}`);
      });

      // Bersihkan: hapus entri suspicious
      const cleanHistory = history.filter(h =>
        !(SUSPICIOUS_STATUSES.includes(h.status) && h.duration_minutes <= DURATION_THRESHOLD)
      );

      db.prepare("UPDATE projects SET history = ? WHERE id_ihld = ?").run(
        JSON.stringify(cleanHistory),
        row.id_ihld
      );
      cleanedCount++;
    }
  } catch (e) {
    console.error(`Error parsing history for ${row.id_ihld}:`, e.message);
  }
}

console.log('\n' + '='.repeat(60));
console.log(`Rows dengan false-positive history: ${falsePositiveCount}`);
console.log(`Rows yang dibersihkan: ${cleanedCount}`);
db.close();
console.log('\nSelesai!');
