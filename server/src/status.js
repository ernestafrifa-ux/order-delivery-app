// Shared logic for deriving a human status for an order item / order.
// Pipeline: Ordered -> Purchased -> Shipped (tracking assigned) -> Delivered (received = Yes)
function itemStatus(item) {
  if (item.received === "Yes") return "Delivered";
  if (item.tracking_no && String(item.tracking_no).trim() !== "") return "Shipped";
  if (item.purchased) return "Purchased";
  return "Ordered";
}

// Order status = the "earliest" stage among its items (the order isn't
// done until every item in it is delivered).
const STAGE_RANK = { Ordered: 0, Purchased: 1, Shipped: 2, Delivered: 3 };

function orderStatus(items) {
  if (!items || items.length === 0) return "Ordered";
  let min = 3;
  for (const it of items) {
    const s = itemStatus(it);
    min = Math.min(min, STAGE_RANK[s]);
  }
  return Object.keys(STAGE_RANK).find((k) => STAGE_RANK[k] === min);
}

module.exports = { itemStatus, orderStatus };
