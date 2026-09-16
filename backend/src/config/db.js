// Central MySQL connection pool.
// Every other file (models, controllers) imports THIS instead of creating
// its own connection - keeps credentials in one place and connections pooled.

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  // Many managed free-tier MySQL plans (e.g. Clever Cloud) cap the account
  // at 5 concurrent connections server-side. A pool limit above that lets
  // the pool attempt more connections than the server allows, which fails
  // with ER_USER_LIMIT_REACHED under any real concurrent load (a single
  // dashboard load alone fires several queries at once) instead of just
  // queueing. Keep this at/under your DB plan's actual cap.
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 4,
  queueLimit: 0,
  // Most managed MySQL hosts (Railway, PlanetScale) require SSL in production
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
});

// Quick helper used at server startup to confirm the DB is reachable
// before the app starts accepting traffic.
async function testConnection() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
}

module.exports = { pool, testConnection };
