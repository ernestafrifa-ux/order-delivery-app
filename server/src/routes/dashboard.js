const express = require("express");
const db = require("../db");
const { itemStatus } = require("../status");

const router = express.Router();

router.get("/", (req, res) => {
  const items = db.prepare(`SELECT * FROM order_items`).all();
  const counts = { Ordered: 0, Purchased: 0, Shipped: 0, Delivered: 0 };
  let totalShippingCost = 0;
  let totalItemValue = 0;
  const agencyCounts = {};

  for (const it of items) {
    const s = itemStatus(it);
    counts[s] += 1;
    if (it.shipping_amount) totalShippingCost += Number(it.shipping_amount) || 0;
    if (it.price) totalItemValue += Number(it.price) || 0;
    if (it.shipping_agency) {
      agencyCounts[it.shipping_agency] = (agencyCounts[it.shipping_agency] || 0) + 1;
    }
  }

  const customerCount = db.prepare(`SELECT COUNT(*) AS c FROM customers`).get().c;
  const orderCount = db.prepare(`SELECT COUNT(*) AS c FROM orders`).get().c;

  // Items overdue: expected_date in the past and not yet delivered.
  const today = new Date().toISOString().slice(0, 10);
  const overdue = items.filter((it) => {
    if (it.received === "Yes") return false;
    if (!it.expected_date) return false;
    const d = String(it.expected_date).slice(0, 10);
    return d < today;
  });

  res.json({
    customer_count: customerCount,
    order_count: orderCount,
    item_count: items.length,
    status_counts: counts,
    total_shipping_cost: Math.round(totalShippingCost * 100) / 100,
    total_item_value: Math.round(totalItemValue * 100) / 100,
    agency_counts: agencyCounts,
    overdue_count: overdue.length,
  });
});

module.exports = router;
