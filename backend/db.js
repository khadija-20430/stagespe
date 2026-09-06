require('dotenv').config();
const { Pool, types } = require('pg');

types.setTypeParser(1114, (str) => new Date(str + 'Z'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;