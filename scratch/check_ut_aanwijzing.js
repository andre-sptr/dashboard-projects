const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data/projects.db');
const db = new Database(dbPath);

const ut = db.prepare('SELECT * FROM ut LIMIT 10').all();
console.log('UT Data:', JSON.stringify(ut, null, 2));

const aanwijzing = db.prepare('SELECT * FROM aanwijzing LIMIT 10').all();
console.log('Aanwijzing Data:', JSON.stringify(aanwijzing, null, 2));
