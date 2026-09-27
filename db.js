const { Pool } = require("pg");

// This module is cached by Node.js, so this one Pool instance is shared by
// every route for the lifetime of the process. Keep its size below the
// session-pooler limit used by the hosted PostgreSQL service.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: Number(process.env.PGPOOL_MAX || 5),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});

function convertPlaceholders(sql) {
  let parameterIndex = 0;
  return sql.replace(/\?/g, () => `$${++parameterIndex}`);
}

async function execute(sql, params = []) {
  const postgresSql = convertPlaceholders(sql);
  const needsUserInsertId =
    /^\s*INSERT\s+INTO\s+users\b/i.test(postgresSql) &&
    !/\bRETURNING\b/i.test(postgresSql);
  const query = needsUserInsertId
    ? `${postgresSql.trim().replace(/;$/, "")} RETURNING user_id AS "insertId"`
    : postgresSql;
  const result = await pool.query(query, params);

  // Keep the small mysql2-style API expected by server.js.  SELECT queries
  // return rows, while user registration receives an object with insertId.
  if (needsUserInsertId) {
    return [{ insertId: result.rows[0].insertId }];
  }

  return [result.rows];
}

module.exports = { execute };
