const express = require("express");
const db = require("../db");
const { orderStatus, itemStatus } = require("../status");

const router = express.Router();

function loadOrder(id) {
  const order = db.prepare(`
    SELECT o.*, c.name AS customer_name
    FROM orders o JOIN customers c ON c.id = o.customer_id
    WHERE o.id = ?
  `).get(id);
  if (!order) return null;
  const items = db.prepare(`SELECT * FROM order_items WHERE order_id = ? ORDER BY id`).all(id);
  return { ...order, items, status: orderStatus(items) };
}

// List orders, optionally filtered by status/agency/search term.
router.get("/", (req, res) => {
  const { status, agency, q } = req.query;
  const orders = db.prepare(`
    SELECT o.*, c.name AS customer_name
    FROM orders o JOIN customers c ON c.id = o.customer_id
    ORDER BY o.order_date DESC, o.id DESC
  `).all();
  const itemsStmt = db.prepare(`SELECT * FROM order_items WHERE order_id = ? ORDER BY id`);

  let result = orders.map((o) => {
    const items = itemsStmt.all(o.id);
    return { ...o, items, status: orderStatus(items) };
  });

  if (status) result = result.filter((o) => o.status === status);
  if (agency) {
    result = result.filter((o) => o.items.some((i) => (i.shipping_agency || "").toLowerCase() === agency.toLowerCase()));
  }
  if (q) {
    const needle = q.toLowerCase();
    result = result.filter(
      (o) =>
        o.customer_name.toLowerCase().includes(needle) ||
        o.items.some(
          (i) =>
            (i.item_name || "").toLowerCase().includes(needle) ||
            (i.tracking_no || "").toLowerCase().includes(needle)
        )
    );
  }

  res.json(result);
});

router.get("/:id", (req, res) => {
  const order = loadOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

// Create an order with an initial batch of items.
router.post("/", (req, res) => {
  const { customer_id, order_date, notes, items } = req.body;
  if (!customer_id) return res.status(400).json({ error: "customer_id is required" });
  const customer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(customer_id);
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  const insertOrder = db.prepare(`INSERT INTO orders (customer_id, order_date, notes) VALUES (?, ?, ?)`);
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, item_name, qty, price, shipping_agency, shipping_amount, expected_date, tracking_no, received, purchased)
    VALUES (@order_id, @item_name, @qty, @price, @shipping_agency, @shipping_amount, @expected_date, @tracking_no, @received, @purchased)
  `);

  const tx = db.transaction(() => {
    const info = insertOrder.run(customer_id, order_date || null, notes || null);
    const orderId = info.lastInsertRowid;
    for (const it of items || []) {
      if (!it.item_name || !it.item_name.trim()) continue;
      insertItem.run({
        order_id: orderId,
        item_name: it.item_name.trim(),
        qty: it.qty ?? null,
        price: it.price ?? null,
        shipping_agency: it.shipping_agency || null,
        shipping_amount: it.shipping_amount ?? null,
        expected_date: it.expected_date || null,
        tracking_no: it.tracking_no || null,
        received: it.received === "Yes" ? "Yes" : "No",
        purchased: it.purchased ? 1 : 0,
      });
    }
    return orderId;
  });

  const orderId = tx();
  res.status(201).json(loadOrder(orderId));
});

router.put("/:id", (req, res) => {
  const existing = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Order not found" });
  const { order_date, notes } = req.body;
  db.prepare(`UPDATE orders SET order_date = ?, notes = ? WHERE id = ?`).run(
    order_date ?? existing.order_date,
    notes ?? existing.notes,
    req.params.id
  );
  res.json(loadOrder(req.params.id));
});

router.delete("/:id", (req, res) => {
  const existing = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Order not found" });
  db.prepare(`DELETE FROM orders WHERE id = ?`).run(req.params.id);
  res.status(204).end();
});

// Add a single item to an existing order.
router.post("/:id/items", (req, res) => {
  const order = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  const it = req.body;
  if (!it.item_name || !it.item_name.trim()) return res.status(400).json({ error: "item_name is required" });
  const info = db.prepare(`
    INSERT INTO order_items (order_id, item_name, qty, price, shipping_agency, shipping_amount, expected_date, tracking_no, received, purchased)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.id,
    it.item_name.trim(),
    it.qty ?? null,
    it.price ?? null,
    it.shipping_agency || null,
    it.shipping_amount ?? null,
    it.expected_date || null,
    it.tracking_no || null,
    it.received === "Yes" ? "Yes" : "No",
    it.purchased ? 1 : 0
  );
  res.status(201).json(loadOrder(req.params.id));
});

// Update an item (price, tracking no, mark purchased/received, etc).
router.put("/:orderId/items/:itemId", (req, res) => {
  const item = db.prepare(`SELECT * FROM order_items WHERE id = ? AND order_id = ?`).get(req.params.itemId, req.params.orderId);
  if (!item) return res.status(404).json({ error: "Item not found" });
  const merged = { ...item, ...req.body };
  db.prepare(`
    UPDATE order_items SET item_name = ?, qty = ?, price = ?, shipping_agency = ?, shipping_amount = ?,
      expected_date = ?, tracking_no = ?, received = ?, purchased = ?
    WHERE id = ?
  `).run(
    merged.item_name,
    merged.qty,
    merged.price,
    merged.shipping_agency,
    merged.shipping_amount,
    merged.expected_date,
    merged.tracking_no,
    merged.received === "Yes" ? "Yes" : "No",
    merged.purchased ? 1 : 0,
    req.params.itemId
  );
  res.json(loadOrder(req.params.orderId));
});

router.delete("/:orderId/items/:itemId", (req, res) => {
  const item = db.prepare(`SELECT * FROM order_items WHERE id = ? AND order_id = ?`).get(req.params.itemId, req.params.orderId);
  if (!item) return res.status(404).json({ error: "Item not found" });
  db.prepare(`DELETE FROM order_items WHERE id = ?`).run(req.params.itemId);
  res.json(loadOrder(req.params.orderId));
});

module.exports = router;
