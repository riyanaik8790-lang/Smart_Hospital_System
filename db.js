const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function convertPlaceholders(sql) {
  let parameterIndex = 0;
  return sql.replace(/\?/g, () => `$${++parameterIndex}`);
}

async function execute(sql, params = []) {
  const postgresSql = convertPlaceholders(sql);
  const result = await pool.query(postgresSql, params);
  return [result.rows];
}

module.exports = { execute };
