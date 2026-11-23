/**
 * Database Connection Pool
 * R-02: Parameterized Queries (Anti-SQLi)
 * TB-3: Koneksi DB hanya dari host aplikasi
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

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

const pool = mysql.createPool({
  host,
  port,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  // Hardening: Prevent multiple statements injection
  multipleStatements: false,
  timezone: '+07:00'
});

// Self-test
pool.getConnection()
  .then(conn => {
    console.log(`✅ [Database] Berhasil terhubung ke MySQL ${database} di ${host}:${port}`);
    conn.release();
  })
  .catch(err => {
    console.error('❌ [Database] Gagal terhubung ke MySQL:', err.message);
  });

module.exports = pool;
