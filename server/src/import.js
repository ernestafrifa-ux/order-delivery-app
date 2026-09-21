// One-time importer: reads the "Shipping_Customers.xlsx" workbook (one sheet
// per customer, one row per item ordered) and loads it into the app's
// SQLite database as customers -> orders -> order_items.
//
// Usage: node src/import.js /path/to/Shipping_Customers.xlsx
const path = require("path");
const XLSX = require("xlsx");
const db = require("./db");

const SRC = process.argv[2];
if (!SRC) {
  console.error("Usage: node src/import.js /path/to/workbook.xlsx");
  process.exit(1);
}

// --- header -> canonical field mapping -------------------------------------
const CANONICAL_ORDER = [
  "item_name",
  "qty",
  "price",
  "order_date",
  "expected_date",
  "shipping_agency",
  "shipping_amount",
  "tracking_no",
  "received",
];

function matchField(header) {
  const h = String(header || "").trim().toLowerCase();
  if (h.includes("item") && !h.includes("receiv")) return "item_name";
  if (h === "qty" || h.includes("quantity")) return "qty";
  if (h === "price") return "price";
  if (h.includes("order") && h.includes("date")) return "order_date";
  if (h.includes("expect")) return "expected_date";
  if (h.includes("agency")) return "shipping_agency";
  if (h.includes("shipping") && h.includes("amount")) return "shipping_amount";
  if (h.includes("track")) return "tracking_no";
  if (h.includes("receiv")) return "received";
  return null;
}

function buildColumnMap(headerRow) {
  const map = {}; // colIndex -> field
  const used = new Set();
  headerRow.slice(0, 9).forEach((header, idx) => {
    const field = matchField(header);
    if (field && !used.has(field)) {
      map[idx] = field;
      used.add(field);
    }
  });
  // Positional fallback for any of the first 9 columns that didn't match a
  // keyword (covers sheets where a header was overwritten with e.g. an
  // agency name instead of "Shipping Agency").
  for (let idx = 0; idx < 9; idx++) {
    if (map[idx] === undefined) {
      const fallback = CANONICAL_ORDER[idx];
      if (fallback && !used.has(fallback)) {
        map[idx] = fallback;
        used.add(fallback);
      }
    }
  }
  return map;
}

// --- date normalizing --------------------------------------------------
function normalizeDate(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const s = String(value).trim();
  // DD/MM/YYYY or DD-MM-YYYY or DD-MM-YY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = `20${y}`;
    d = d.padStart(2, "0");
    mo = mo.padStart(2, "0");
    return `${y}-${mo}-${d}`;
  }
  return s; // leave as-is if we can't confidently parse it
}

function cleanValue(v) {
  if (v === undefined) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  return v;
}

// --- main import ---------------------------------------------------------
const wb = XLSX.readFile(SRC, { cellDates: true });

const insertCustomer = db.prepare(`INSERT INTO customers (name) VALUES (?)`);
const findCustomer = db.prepare(`SELECT id FROM customers WHERE name = ?`);
const insertOrder = db.prepare(`INSERT INTO orders (customer_id, order_date) VALUES (?, ?)`);
const insertItem = db.prepare(`
  INSERT INTO order_items (order_id, item_name, qty, price, shipping_agency, shipping_amount, expected_date, tracking_no, received)
  VALUES (@order_id, @item_name, @qty, @price, @shipping_agency, @shipping_amount, @expected_date, @tracking_no, @received)
`);

let totalCustomers = 0;
let totalOrders = 0;
let totalItems = 0;

const runImport = db.transaction(() => {
  for (const sheetName of wb.SheetNames) {
    const customerName = sheetName.trim();
    if (!customerName) continue;
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });
    if (rows.length === 0) continue;

    const headerRow = rows[0];
    const colMap = buildColumnMap(headerRow);

    // Parse every data row into a normalized item object first, so we can
    // skip the sheet entirely if it turns out to have no real items.
    const items = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const record = {};
      for (const [idx, field] of Object.entries(colMap)) {
        record[field] = cleanValue(row[Number(idx)]);
      }
      if (!record.item_name) continue; // skip stray/blank rows
      items.push({
        item_name: String(record.item_name).trim(),
        qty: record.qty !== null && record.qty !== undefined ? String(record.qty) : null,
        price: record.price !== null && record.price !== undefined ? record.price : null,
        shipping_agency: record.shipping_agency ? String(record.shipping_agency).trim() : null,
        shipping_amount:
          typeof record.shipping_amount === "number"
            ? record.shipping_amount
            : record.shipping_amount
            ? Number(String(record.shipping_amount).replace(/[^0-9.]/g, "")) || null
            : null,
        order_date: normalizeDate(record.order_date),
        expected_date: normalizeDate(record.expected_date),
        tracking_no: record.tracking_no !== null && record.tracking_no !== undefined ? String(record.tracking_no).trim() : null,
        received: String(record.received || "No").trim().toLowerCase() === "yes" ? "Yes" : "No",
      });
    }
    if (items.length === 0) continue;

    // One customer per sheet.
    let customerId = findCustomer.get(customerName)?.id;
    if (!customerId) {
      customerId = insertCustomer.run(customerName).lastInsertRowid;
      totalCustomers++;
    }

    // Group items into orders by their order_date (items sharing the same
    // order date came from the same purchase run), falling back to one
    // order for any items with no date at all.
    const groups = new Map();
    for (const it of items) {
      const key = it.order_date || "__no_date__";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(it);
    }

    for (const [orderDate, groupItems] of groups) {
      const orderId = insertOrder.run(customerId, orderDate === "__no_date__" ? null : orderDate).lastInsertRowid;
      totalOrders++;
      for (const it of groupItems) {
        insertItem.run({
          order_id: orderId,
          item_name: it.item_name,
          qty: it.qty,
          price: it.price,
          shipping_agency: it.shipping_agency,
          shipping_amount: it.shipping_amount,
          expected_date: it.expected_date,
          tracking_no: it.tracking_no,
          received: it.received,
        });
        totalItems++;
      }
    }
  }
});

runImport();

console.log(`Imported ${totalCustomers} customers, ${totalOrders} orders, ${totalItems} items from ${path.basename(SRC)}.`);
