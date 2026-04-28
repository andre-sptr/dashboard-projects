const db = require('better-sqlite3')(require('path').join(process.cwd(), 'data/projects.db'));

const rows = db.prepare("SELECT id_ihld, status, sub_status, history FROM projects WHERE history != '[]'").all();
console.log(`\nRows dengan non-empty history: ${rows.length}`);
console.log('='.repeat(60));

for (const row of rows) {
  const history = JSON.parse(row.history);
  console.log(`\nID: ${row.id_ihld} | Current: ${row.status} | ${row.sub_status}`);
  history.forEach((h, i) => {
    console.log(`  [${i+1}] ${h.status} | ${h.sub_status} | ${h.duration_minutes} mnt | ${h.ended_at}`);
  });
}

db.close();
