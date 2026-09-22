/**
 * Database Configuration & Connection Pool
 * 
 * Uses mysql2/promise for asynchronous query execution with connection pooling.
 * Automatically loads credentials from environment variables.
 */

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Ensure environment variables are loaded
dotenv.config({ path: path.join(__dirname, '../../.env') });

const isVercel = Boolean(process.env.VERCEL);
const hasExternalDb = Boolean(
  process.env.DB_HOST && 
  process.env.DB_HOST !== 'localhost' && 
  process.env.DB_HOST !== '127.0.0.1'
);
const isDbAvailable = !isVercel || hasExternalDb;

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'real_news_db',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 2000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+00:00'
};

const pool = mysql.createPool(poolConfig);

/**
 * Tests database connectivity
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  if (!isDbAvailable) {
    return false;
  }
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
  isDbAvailable
};
