import { useState } from "react";

const emptyItem = () => ({
  item_name: "",
  qty: "",
  price: "",
  shipping_agency: "",
  shipping_amount: "",
  expected_date: "",
  tracking_no: "",
});

export default function NewOrderForm({ onSubmit, onCancel }) {
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([emptyItem()]);
  const [saving, setSaving] = useState(false);

  function updateItem(idx, field, value) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  }

  function addRow() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeRow(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const cleanItems = items.filter((it) => it.item_name.trim());
    if (cleanItems.length === 0) return;
    setSaving(true);
    try {
      await onSubmit({ order_date: orderDate, items: cleanItems });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 16 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Order date</label>
        <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10 }}>
        <thead>
          <tr style={{ textAlign: "left", fontSize: 12, color: "#475569" }}>
            <th style={th}>Item *</th>
            <th style={th}>Qty</th>
            <th style={th}>Price</th>
            <th style={th}>Agency</th>
            <th style={th}>Ship Cost</th>
            <th style={th}>Expected</th>
            <th style={th}>Tracking No</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx}>
              <td style={td}>
                <input style={inp} value={it.item_name} onChange={(e) => updateItem(idx, "item_name", e.target.value)} />
              </td>
              <td style={td}>
                <input style={inp} value={it.qty} onChange={(e) => updateItem(idx, "qty", e.target.value)} />
              </td>
              <td style={td}>
                <input style={inp} value={it.price} onChange={(e) => updateItem(idx, "price", e.target.value)} />
              </td>
              <td style={td}>
                <input
                  style={inp}
                  value={it.shipping_agency}
                  onChange={(e) => updateItem(idx, "shipping_agency", e.target.value)}
                />
              </td>
              <td style={td}>
                <input
                  style={inp}
                  value={it.shipping_amount}
                  onChange={(e) => updateItem(idx, "shipping_amount", e.target.value)}
                />
              </td>
              <td style={td}>
                <input
                  style={inp}
                  type="date"
                  value={it.expected_date}
                  onChange={(e) => updateItem(idx, "expected_date", e.target.value)}
                />
              </td>
              <td style={td}>
                <input style={inp} value={it.tracking_no} onChange={(e) => updateItem(idx, "tracking_no", e.target.value)} />
              </td>
              <td style={td}>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeRow(idx)} style={{ fontSize: 12 }}>
                    ✕
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button type="button" onClick={addRow} style={{ fontSize: 13, marginRight: 10 }}>
        + Add item
      </button>
      <button type="submit" disabled={saving} style={{ fontSize: 13, marginRight: 10 }}>
        {saving ? "Saving…" : "Create Order"}
      </button>
      <button type="button" onClick={onCancel} style={{ fontSize: 13 }}>
        Cancel
      </button>
    </form>
  );
}

const th = { padding: "6px 8px" };
const td = { padding: "4px 8px" };
const inp = { width: "100%", fontSize: 13, padding: "4px 6px" };
