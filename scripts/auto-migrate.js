/**
 * Auto-Migrate Database Helper
 * Mengecek apakah tabel database sudah ada. Jika belum, otomatis mengeksekusi schema.sql.
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function autoInitDatabase() {
  let host = process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1';
  let port = parseInt(process.env.DB_PORT || process.env.MYSQLPORT) || 3306;
  let user = process.env.DB_USER || process.env.MYSQLUSER || 'root';
  let password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';
  let database = process.env.DB_NAME || process.env.MYSQLDATABASE || 'siakad_db';

  const connUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  if (connUrl && !process.env.DB_HOST && !process.env.MYSQLHOST) {
    try {
      const parsed = new URL(connUrl);
      host = parsed.hostname;
      port = parseInt(parsed.port) || 3306;
      user = decodeURIComponent(parsed.username);
      password = decodeURIComponent(parsed.password);
      database = parsed.pathname.replace(/^\//, '');
    } catch (e) {
      console.warn('⚠️ Gagal parse connection URL:', e.message);
    }
  }

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
