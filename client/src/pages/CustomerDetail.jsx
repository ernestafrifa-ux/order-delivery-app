import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import StatusBadge from "../components/StatusBadge";
import ItemRow from "../components/ItemRow";
import NewOrderForm from "../components/NewOrderForm";

export default function CustomerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  function load() {
    api.getCustomerOrders(id).then(setData).catch((e) => setError(e.message));
  }

  useEffect(load, [id]);

  async function handleCreateOrder(payload) {
    await api.createOrder({ customer_id: Number(id), ...payload });
    setShowForm(false);
    load();
  }

  async function handleSaveItem(orderId, itemId, form) {
    await api.updateItem(orderId, itemId, form);
    load();
  }

  async function handleDeleteItem(orderId, itemId) {
    if (!confirm("Delete this item?")) return;
    await api.deleteItem(orderId, itemId);
    load();
  }

  async function handleDeleteOrder(orderId) {
    if (!confirm("Delete this whole order and its items?")) return;
    await api.deleteOrder(orderId);
    load();
  }

  if (error) return <p style={{ color: "#b91c1c" }}>{error}</p>;
  if (!data) return <p>Loading…</p>;

  const { customer, orders } = data;

  return (
    <div>
      <Link to="/customers" style={{ fontSize: 13 }}>
        ← All customers
      </Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0 16px" }}>
        <div>
          <h1 style={{ margin: 0 }}>{customer.name}</h1>
          <p style={{ color: "#64748b", marginTop: 4 }}>
            {customer.phone || "No phone on file"} {customer.location ? `· ${customer.location}` : ""}
          </p>
        </div>
        <button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "+ New Order"}</button>
      </div>

      {showForm && <NewOrderForm onSubmit={handleCreateOrder} onCancel={() => setShowForm(false)} />}

      {orders.length === 0 && <p>No orders yet for this customer.</p>}

      {orders.map((order) => (
        <div
          key={order.id}
          style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, marginBottom: 16, overflow: "hidden" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 16px",
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <strong>Order #{order.id}</strong>
              <span style={{ fontSize: 13, color: "#64748b" }}>{order.order_date || "no date"}</span>
              <StatusBadge status={order.status} />
            </div>
            <button onClick={() => handleDeleteOrder(order.id)} style={{ fontSize: 12, color: "#b91c1c" }}>
              Delete order
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr style={{ textAlign: "left", fontSize: 12, color: "#475569" }}>
                  <th style={th}>Item</th>
                  <th style={th}>Qty</th>
                  <th style={th}>Price</th>
                  <th style={th}>Agency</th>
                  <th style={th}>Ship Cost</th>
                  <th style={th}>Expected</th>
                  <th style={th}>Tracking No</th>
                  <th style={th}>Status</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onSave={(itemId, form) => handleSaveItem(order.id, itemId, form)}
                    onDelete={(itemId) => handleDeleteItem(order.id, itemId)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

const th = { padding: "10px 12px" };
