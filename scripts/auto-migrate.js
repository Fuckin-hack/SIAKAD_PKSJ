/**
 * Auto-Migrate Database Helper
 * Mengecek apakah tabel database sudah ada. Jika belum, otomatis mengeksekusi schema.sql.
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function autoInitDatabase() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'siakad_db';

  console.log(`🔍 [Database Check] Menghubungkan ke MySQL (${host}:${port}/${database})...`);

  let connection;
  let retries = 5;

  while (retries > 0) {
    try {
      connection = await mysql.createConnection({
        host,
        port,
        user,
        password,
        database,
        multipleStatements: true
      });
      break;
    } catch (err) {
      retries--;
      console.warn(`⏳ [Database Wait] Menunggu MySQL siap... (${5 - retries}/5): ${err.message}`);
      if (retries === 0) {
        console.error('❌ [Database Error] Gagal terhubung ke MySQL setelah 5 percobaan.');
        return;
      }
      await new Promise(res => setTimeout(res, 2500));
    }
  }

  try {
    // Cek apakah tabel users sudah ada
    const [rows] = await connection.query("SHOW TABLES LIKE 'users'");
    if (rows && rows.length > 0) {
      console.log('✅ [Database Ready] Tabel database sudah tersedia, melewati inisialisasi.');
      return;
    }

    console.log('⚡ [Database Init] Tabel belum ditemukan, mengeksekusi schema.sql otomatis...');
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    await connection.query(sqlContent);
    console.log('🎉 [Database Init] Seluruh tabel & data dummy SIAKAD berhasil diinisialisasi secara otomatis!');
  } catch (err) {
    console.error('❌ [Database Init Error]:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

module.exports = autoInitDatabase;
