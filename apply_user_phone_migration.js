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
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT');
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_10_digits'
        ) THEN
          ALTER TABLE users
            ADD CONSTRAINT users_phone_10_digits
            CHECK (phone IS NULL OR phone ~ '^[0-9]{10}$');
        END IF;
      END $$;
    `);
    console.log('Migration applied: users.phone is ready.');
  } finally {
    await pool.end();
  }
}

applyMigration().catch((error) => {
  console.error('User phone migration failed:', error.message);
  process.exit(1);
});
