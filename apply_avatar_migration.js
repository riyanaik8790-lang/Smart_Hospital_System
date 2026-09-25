require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function applyAvatarMigration() {
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT");
    const result = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'avatar_url'"
    );
    if (!result.rows.length) throw new Error("Column verification failed.");
    console.log("Migration applied: users.avatar_url exists.");
  } finally {
    await pool.end();
  }
}

applyAvatarMigration().catch((error) => {
  console.error("Avatar migration failed:", error.message);
  process.exit(1);
});
