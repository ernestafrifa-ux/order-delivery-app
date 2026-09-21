import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../api/client";
import StatusBadge from "../components/StatusBadge";

const STATUSES = ["Ordered", "Purchased", "Shipped", "Delivered"];

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [q, setQ] = useState(searchParams.get("q") || "");

  const status = searchParams.get("status") || "";

  function load() {
    const params = {};
    if (status) params.status = status;
    if (q) params.q = q;
    api.getOrders(params).then(setOrders).catch((e) => setError(e.message));
  }

  useEffect(load, [status, q]);

  function setStatus(s) {
    const next = new URLSearchParams(searchParams);
    if (s) next.set("status", s);
    else next.delete("status");
    setSearchParams(next);
  }

  // Flatten to one row per item for a delivery-tracking-style view, since
  // that's the granularity that matters (each item has its own tracking no).
  // Filter by the item's own status here too, since the server-side status
  // filter operates at the order level (an order's status is its least-done
  // item), which could otherwise hide an individually-matching item.
  const rows = orders
    .flatMap((o) =>
      o.items.map((it) => ({
        order_id: o.id,
        customer_id: o.customer_id,
        customer_name: o.customer_name,
        order_date: o.order_date,
        ...it,
      }))
    )
    .filter((r) => !status || itemStatus(r) === status);

  return (
    <div>
      <h1 style={{ margin: 0 }}>Orders &amp; Delivery Tracking</h1>
      <p style={{ color: "#64748b", marginTop: 4 }}>Every item across every customer, with live delivery status.</p>

      <div style={{ display: "flex", gap: 8, margin: "16px 0", flexWrap: "wrap" }}>
        <button onClick={() => setStatus("")} style={status === "" ? activeBtn : btn}>
          All
        </button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)} style={status === s ? activeBtn : btn}>
            {s}
          </button>
        ))}
        <input
          placeholder="Search customer, item or tracking no…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ marginLeft: "auto", width: 280 }}
        />
      </div>

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left", fontSize: 12, color: "#475569" }}>
              <th style={th}>Customer</th>
              <th style={th}>Item</th>
              <th style={th}>Qty</th>
              <th style={th}>Order Date</th>
              <th style={th}>Agency</th>
              <th style={th}>Expected</th>
              <th style={th}>Tracking No</th>
              <th style={th}>Status</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #eef2f7" }}>
                <td style={td}>{r.customer_name}</td>
                <td style={td}>{r.item_name}</td>
                <td style={td}>{r.qty ?? "—"}</td>
                <td style={td}>{r.order_date || "—"}</td>
                <td style={td}>{r.shipping_agency || "—"}</td>
                <td style={td}>{r.expected_date || "—"}</td>
                <td style={td}>
                  <code style={{ fontSize: 12 }}>{r.tracking_no || "—"}</code>
                </td>
                <td style={td}>
                  <StatusBadge status={itemStatus(r)} />
                </td>
                <td style={td}>
                  <Link to={`/customers/${r.customer_id}`} style={{ fontSize: 12 }}>
                    Open order →
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td style={td} colSpan={9}>
                  No items match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function itemStatus(item) {
  if (item.received === "Yes") return "Delivered";
  if (item.tracking_no && String(item.tracking_no).trim() !== "") return "Shipped";
  if (item.purchased) return "Purchased";
  return "Ordered";
}

const th = { padding: "10px 12px" };
const td = { padding: "9px 12px", fontSize: 13 };
const btn = { fontSize: 13, padding: "6px 12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" };
const activeBtn = { ...btn, background: "#2563eb", color: "#fff", border: "1px solid #2563eb" };
