const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");
const { hashPassword } = require("./passwords");

// Uses Node's built-in SQLite module (stable since Node 22.5+) instead of a
// native addon like better-sqlite3, so `npm install` never needs a C++
// compiler / Visual Studio Build Tools on Windows.

// DATA_DIR lets a host with a persistent disk (e.g. Render) point this at a
// mounted volume, so the database survives redeploys. Defaults to a local
// folder for development.
const dataDir = process.env.DATA_DIR || path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "app.db");
const seedPath = path.join(__dirname, "..", "seed", "app.db");

let db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

// Every CREATE TABLE the app needs. Called again below if the seed copy
// fires, since the reopened connection points at a different file (the
// seed file) that may predate newer tables such as `users`.
function ensureSchema() {
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

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);
}

ensureSchema();

// On a host with a persistent Volume (e.g. Railway), DATA_DIR points at a
// disk that starts out with an empty database — the schema above creates
// the (empty) tables, but there's no data. If a pre-loaded seed copy shipped
// with the code and the database is genuinely empty (no customers yet),
// load the seed data in. This only fires when the customers table has zero
// rows, so it never touches or overwrites anything you've since added.
// Do this BEFORE the user-bootstrap step below, since it swaps out the
// entire database file (and, on an older seed file, may not yet have a
// `users` table until ensureSchema() re-runs against the new connection).
if (fs.existsSync(seedPath)) {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM customers").get();
  if (count === 0) {
    db.close();
    fs.copyFileSync(seedPath, dbPath);
    console.log(`Database at ${dbPath} was empty — seeded it from ${seedPath}.`);
    db = new DatabaseSync(dbPath);
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA foreign_keys = ON");
    ensureSchema(); // the seed file may predate tables added since it was captured
  }
}

// Bootstrap the very first account from ADMIN_USERNAME/ADMIN_PASSWORD (the
// env vars used before multi-user support existed) so nobody gets locked
// out when this code first runs against an existing deployment. Only fires
// once — as soon as any user exists, new accounts are created from the
// admin page instead, and these env vars are no longer read for login.
// Runs LAST, against the final (possibly seeded, definitely schema'd)
// connection, so the seed-copy step above can never wipe it out.
{
  const { count: userCount } = db.prepare("SELECT COUNT(*) AS count FROM users").get();
  if (userCount === 0 && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(
      process.env.ADMIN_USERNAME,
      hashPassword(process.env.ADMIN_PASSWORD)
    );
    console.log(`No users yet — created initial account "${process.env.ADMIN_USERNAME}" from ADMIN_USERNAME/ADMIN_PASSWORD.`);
  }
}

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
