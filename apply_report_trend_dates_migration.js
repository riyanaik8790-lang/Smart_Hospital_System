require('dotenv').config();

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function applyMigration() {
  try {
    await pool.query('ALTER TABLE patients ADD COLUMN IF NOT EXISTS discharged_at TIMESTAMPTZ');
    console.log('Migration applied: patients.discharged_at is ready.');
  } finally {
    await pool.end();
  }
}

applyMigration().catch((error) => {
  console.error('Report trend dates migration failed:', error.message);
  process.exit(1);
});
