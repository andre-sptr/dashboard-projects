const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data/projects.db');
const db = new Database(dbPath);

const projects = db.prepare('SELECT id_ihld, nama_lop, full_data FROM projects LIMIT 10').all();

projects.forEach(p => {
    console.log(`ID: ${p.id_ihld} | LOP: ${p.nama_lop}`);
    try {
        const fd = JSON.parse(p.full_data);
        console.log('Full Data Sample:', fd.slice(0, 32));
    } catch (e) {
        console.log('Error parsing full_data');
    }
    console.log('---');
});
