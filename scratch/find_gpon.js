const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data/projects.db');
const db = new Database(dbPath);

const rows = db.prepare("SELECT id_ihld, full_data FROM projects").all();
let found = 0;
rows.forEach(r => {
    if (r.full_data.includes('GPON')) {
        console.log(`Found GPON in ${r.id_ihld}`);
        found++;
    }
});
console.log(`Total found: ${found}`);
