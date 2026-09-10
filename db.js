const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'hospital.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Promise-based execute wrapper to mimic mysql2/promise interface
function execute(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const trimmed = sql.trim().toUpperCase();
      const isSelect = trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA');

      if (isSelect) {
        const stmt = db.prepare(sql);
        const rows = stmt.all(params);
        resolve([rows, []]);
      } else {
        const stmt = db.prepare(sql);
        const info = stmt.run(params);
        resolve([{ insertId: info.lastInsertRowid, affectedRows: info.changes }, []]);
      }
    } catch (err) {
      reject(err);
    }
  });
}

// Initialize DB from schema.sql if tables don't exist
function initializeDB() {
  try {
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (!tableCheck) {
      console.log('Initializing SQLite Database...');
      let schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

      // Strip MySQL-specific statements
      schema = schema.replace(/CREATE DATABASE IF NOT EXISTS[^;]+;/gi, '');
      schema = schema.replace(/USE [^;]+;/gi, '');
      // Convert MySQL -> SQLite syntax
      schema = schema.replace(/INT PRIMARY KEY AUTO_INCREMENT/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
      schema = schema.replace(/AUTO_INCREMENT/gi, '');
      // Remove SELECT union at the end (verification block)
      schema = schema.replace(/SELECT[\s\S]*UNION[\s\S]*/i, '');

      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 5);

      for (const stmt of statements) {
        try {
          db.prepare(stmt).run();
        } catch (e) {
          // Skip statements that fail (e.g. duplicate inserts)
          console.warn('Schema stmt skipped:', e.message);
        }
      }
      console.log('Database Initialization Complete ✅');
    } else {
      console.log('Connected to SQLite Database ✅');
    }
  } catch (err) {
    console.error('Database Initialization Failed:', err);
  }
}

initializeDB();

module.exports = { execute };
