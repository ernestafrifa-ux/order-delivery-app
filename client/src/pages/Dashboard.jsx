import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

const CARD_STYLE = {
  background: "#fff",
  borderRadius: 12,
  padding: 18,
  border: "1px solid #e2e8f0",
};

function StatCard({ label, value, sub }) {
  return (
    <div style={CARD_STYLE}>
      <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getDashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p style={{ color: "#b91c1c" }}>{error}</p>;
  if (!data) return <p>Loading…</p>;

  const { status_counts, agency_counts } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ margin: 0 }}>Overview</h1>
        <p style={{ color: "#64748b", marginTop: 4 }}>
          Snapshot of every customer, order and item currently in the system.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <StatCard label="Customers" value={data.customer_count} />
        <StatCard label="Orders" value={data.order_count} />
        <StatCard label="Items" value={data.item_count} />
        <StatCard label="Overdue Deliveries" value={data.overdue_count} sub="past expected date, not delivered" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {["Ordered", "Purchased", "Shipped", "Delivered"].map((s) => (
          <Link key={s} to={`/orders?status=${s}`} style={{ textDecoration: "none", color: "inherit" }}>
            <StatCard label={s} value={status_counts[s] ?? 0} />
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <StatCard label="Total Item Value (numeric)" value={data.total_item_value.toLocaleString()} sub="sum of parseable item prices" />
        <StatCard label="Total Shipping Cost" value={data.total_shipping_cost.toLocaleString()} sub="sum of shipping amounts" />
      </div>

      <div style={CARD_STYLE}>
        <h3 style={{ marginTop: 0 }}>Items by Shipping Agency</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {Object.entries(agency_counts)
            .sort((a, b) => b[1] - a[1])
            .map(([agency, count]) => (
              <div
                key={agency}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "#f1f5f9",
                  fontSize: 13,
                }}
              >
                <strong>{agency}</strong> — {count}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
