const express = require("express");
const db = require("../db");
const { orderStatus } = require("../status");

const router = express.Router();

// List all customers with quick summary counts.
router.get("/", (req, res) => {
  const customers = db.prepare(`SELECT * FROM customers ORDER BY name COLLATE NOCASE`).all();
  const orderCountStmt = db.prepare(`SELECT COUNT(*) AS c FROM orders WHERE customer_id = ?`);
  const itemsStmt = db.prepare(`
    SELECT oi.* FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.customer_id = ?
  `);
  const result = customers.map((c) => {
    const items = itemsStmt.all(c.id);
    const pendingDelivery = items.filter((i) => i.received !== "Yes").length;
    return {
      ...c,
      order_count: orderCountStmt.get(c.id).c,
      item_count: items.length,
      pending_delivery: pendingDelivery,
    };
  });
  res.json(result);
});

router.get("/:id", (req, res) => {
  const customer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(req.params.id);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json(customer);
});

router.post("/", (req, res) => {
  const { name, phone, location, notes } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Customer name is required" });
  const stmt = db.prepare(`INSERT INTO customers (name, phone, location, notes) VALUES (?, ?, ?, ?)`);
  const info = stmt.run(name.trim(), phone || null, location || null, notes || null);
  const customer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(info.lastInsertRowid);
  res.status(201).json(customer);
});

router.put("/:id", (req, res) => {
  const existing = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Customer not found" });
  const { name, phone, location, notes } = req.body;
  db.prepare(`UPDATE customers SET name = ?, phone = ?, location = ?, notes = ? WHERE id = ?`).run(
    name ?? existing.name,
    phone ?? existing.phone,
    location ?? existing.location,
    notes ?? existing.notes,
    req.params.id
  );
  res.json(db.prepare(`SELECT * FROM customers WHERE id = ?`).get(req.params.id));
});

router.delete("/:id", (req, res) => {
  const existing = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Customer not found" });
  db.prepare(`DELETE FROM customers WHERE id = ?`).run(req.params.id);
  res.status(204).end();
});

// Full order history for one customer, with items + derived status.
router.get("/:id/orders", (req, res) => {
  const customer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(req.params.id);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  const orders = db.prepare(`SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC, id DESC`).all(req.params.id);
  const itemsStmt = db.prepare(`SELECT * FROM order_items WHERE order_id = ? ORDER BY id`);
  const withItems = orders.map((o) => {
    const items = itemsStmt.all(o.id);
    return { ...o, items, status: orderStatus(items) };
  });
  res.json({ customer, orders: withItems });
});

module.exports = router;
