// db.js
//Bu dosya .env’deki bağlantı URL’ini okuyacak ve PostgreSQL’e bağlanacaktır.

const { Pool } = require('pg');
require('dotenv').config();

const isProd = (process.env.NODE_ENV || 'development') === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => console.log('✅ PostgreSQL bağlantısı başarılı!'));
pool.on('error', (err) => console.error('❌ PostgreSQL bağlantı hatası:', err));

module.exports = { pool, query: (text, params) => pool.query(text, params) };

