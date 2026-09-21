const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");

// Uses Node's built-in SQLite module (stable since Node 22.5+) instead of a
// native addon like better-sqlite3, so `npm install` never needs a C++
// compiler / Visual Studio Build Tools on Windows.

// DATA_DIR lets a host with a persistent disk (e.g. Render) point this at a
// mounted volume, so the database survives redeploys. Defaults to a local
// folder for development.
const dataDir = process.env.DATA_DIR || path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "app.db");
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  qty TEXT,
  price REAL,
  shipping_agency TEXT,
  shipping_amount REAL,
  expected_date TEXT,
  tracking_no TEXT,
  received TEXT NOT NULL DEFAULT 'No', -- 'No' | 'Yes'
  purchased INTEGER NOT NULL DEFAULT 0, -- 0/1 has Ernest bought it yet
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_tracking ON order_items(tracking_no);
`);

// Small shim matching better-sqlite3's db.transaction(fn) API, since
// node:sqlite doesn't ship one itself: returns a function that runs `fn`
// wrapped in BEGIN/COMMIT, rolling back if it throws.
db.transaction = function (fn) {
  return function (...args) {
    db.exec("BEGIN");
    try {
      const result = fn(...args);
      db.exec("COMMIT");
      return result;
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  };
};

module.exports = db;
