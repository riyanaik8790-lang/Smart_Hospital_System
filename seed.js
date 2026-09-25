require('dotenv').config();

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const email = 'aastha@gmail.com';
const name = 'Aastha';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedAdmin() {
  try {
    const { rows: admins } = await pool.query(
      "SELECT user_id, email FROM users WHERE LOWER(role) = 'admin' AND is_active = TRUE LIMIT 1"
    );

    if (admins.length) {
      console.log(`Active admin already exists (${admins[0].email}); no account was created.`);
      return;
    }

    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!password || password.length < 8) {
      throw new Error('SEED_ADMIN_PASSWORD is required and must be at least 8 characters long.');
    }

    const { rows: matchingEmail } = await pool.query(
      'SELECT user_id, role FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email]
    );

    if (matchingEmail.length) {
      throw new Error(`${email} already exists but is not an active admin. Resolve that account before seeding.`);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query(
      `INSERT INTO users (name, email, password, role, is_active, must_change_password)
       VALUES ($1, $2, $3, 'admin', TRUE, FALSE)`,
      [name, email, passwordHash]
    );

    console.log(`Created active admin account: ${email}`);
  } finally {
    await pool.end();
  }
}

seedAdmin().catch((error) => {
  console.error(`Admin seed failed: ${error.message}`);
  process.exitCode = 1;
});
