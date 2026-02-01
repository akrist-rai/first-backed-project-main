import { Database } from "bun:sqlite";
import path from "path";
import fs from "fs";

const dbPath = process.env.DATABASE_PATH || "./data/urls.db";

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath, { create: true });
db.exec("PRAGMA journal_mode = WAL;"); // Better performance for concurrent reads

// Prepared statements - will be initialized after tables are created
export let queries: any = {};

// Initialize database schema
export function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // URLs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      short_code TEXT UNIQUE NOT NULL,
      original_url TEXT NOT NULL,
      user_id INTEGER,
      clicks INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
    CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  // Analytics table for tracking clicks
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url_id INTEGER NOT NULL,
      user_agent TEXT,
      referer TEXT,
      ip_address TEXT,
      clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
    )
  `);

  console.log("✅ Database initialized successfully");

  // Now initialize prepared statements AFTER tables are created
  queries = {
    // User queries
    createUser: db.prepare(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)"
    ),
    findUserByUsername: db.prepare("SELECT * FROM users WHERE username = ?"),
    findUserByEmail: db.prepare("SELECT * FROM users WHERE email = ?"),
    findUserById: db.prepare("SELECT id, username, email, created_at FROM users WHERE id = ?"),

    // URL queries
    createUrl: db.prepare(
      "INSERT INTO urls (short_code, original_url, user_id, expires_at) VALUES (?, ?, ?, ?)"
    ),
    findUrlByShortCode: db.prepare("SELECT * FROM urls WHERE short_code = ?"),
    incrementClicks: db.prepare("UPDATE urls SET clicks = clicks + 1 WHERE id = ?"),
    getUserUrls: db.prepare(
      "SELECT id, short_code, original_url, clicks, created_at, expires_at FROM urls WHERE user_id = ? ORDER BY created_at DESC"
    ),
    deleteUrl: db.prepare("DELETE FROM urls WHERE short_code = ? AND user_id = ?"),

    // Analytics queries
    logClick: db.prepare(
      "INSERT INTO analytics (url_id, user_agent, referer, ip_address) VALUES (?, ?, ?, ?)"
    ),
    getUrlAnalytics: db.prepare(
      `SELECT 
        DATE(clicked_at) as date,
        COUNT(*) as clicks
      FROM analytics 
      WHERE url_id = ? 
      GROUP BY DATE(clicked_at)
      ORDER BY date DESC
      LIMIT 30`
    ),
  };
}

// Export database for transactions
export default db;
