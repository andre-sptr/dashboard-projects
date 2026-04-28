/**
 * Reset history semua project ke state bersih.
 * Jalankan SEKALI setelah fix diterapkan untuk membersihkan
 * data yang terkontaminasi dari bug duplikasi ID Excel.
 */
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(process.cwd(), 'data/projects.db'));
db.pragma('journal_mode = WAL');

// Hitung berapa rows terdampak
const total = db.prepare("SELECT COUNT(*) as c FROM projects").get().c;
const withHistory = db.prepare("SELECT COUNT(*) as c FROM projects WHERE history != '[]'").get().c;

console.log(`Total projects: ${total}`);
console.log(`Projects dengan history: ${withHistory}`);
console.log('\nMembersihkan semua history yang terkontaminasi...');

// Reset semua history ke kosong karena tidak bisa tahu mana yang valid
// tanpa data historis yang terpercaya
const result = db.prepare("UPDATE projects SET history = '[]'").run();

console.log(`History dibersihkan: ${result.changes} rows`);
console.log('\nSelesai! Silakan jalankan sinkronasi ulang.');
console.log('Mulai sekarang history akan tercatat dengan benar.');

db.close();
