const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// PostgreSQL connection configuration
const pool = new Pool({
  user: process.env.DB_USER || 'dex',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'dexdb',
  password: process.env.DB_PASSWORD || 'dex',
  port: process.env.DB_PORT || 5432,
});

// Test the connection
pool.on('connect', () => {
  console.log('db connected')
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
  process.exit(-1);
});

module.exports = pool; 