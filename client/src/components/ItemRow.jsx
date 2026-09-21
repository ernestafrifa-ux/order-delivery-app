import { useState } from "react";
import StatusBadge from "./StatusBadge";

function itemStatus(item) {
  if (item.received === "Yes") return "Delivered";
  if (item.tracking_no && String(item.tracking_no).trim() !== "") return "Shipped";
  if (item.purchased) return "Purchased";
  return "Ordered";
}

export default function ItemRow({ item, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onSave(item.id, form);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <tr style={{ borderTop: "1px solid #eef2f7" }}>
        <td style={td}>{item.item_name}</td>
        <td style={td}>{item.qty ?? "—"}</td>
        <td style={td}>{item.price ?? "—"}</td>
        <td style={td}>{item.shipping_agency || "—"}</td>
        <td style={td}>{item.shipping_amount ?? "—"}</td>
        <td style={td}>{item.expected_date || "—"}</td>
        <td style={td}>
          <code style={{ fontSize: 12 }}>{item.tracking_no || "—"}</code>
        </td>
        <td style={td}>
          <StatusBadge status={itemStatus(item)} />
        </td>
        <td style={td}>
          <button onClick={() => setEditing(true)} style={btnSm}>
            Edit
          </button>{" "}
          <button onClick={() => onDelete(item.id)} style={{ ...btnSm, color: "#b91c1c" }}>
            Delete
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ borderTop: "1px solid #eef2f7", background: "#fafaff" }}>
      <td style={td}>
        <input style={inputSm} value={form.item_name || ""} onChange={(e) => setForm({ ...form, item_name: e.target.value })} />
      </td>
      <td style={td}>
        <input style={inputSm} value={form.qty || ""} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
      </td>
      <td style={td}>
        <input style={inputSm} value={form.price ?? ""} onChange={(e) => setForm({ ...form, price: e.target.value })} />
      </td>
      <td style={td}>
        <input
          style={inputSm}
          value={form.shipping_agency || ""}
          onChange={(e) => setForm({ ...form, shipping_agency: e.target.value })}
        />
      </td>
      <td style={td}>
        <input
          style={inputSm}
          value={form.shipping_amount ?? ""}
          onChange={(e) => setForm({ ...form, shipping_amount: e.target.value })}
        />
      </td>
      <td style={td}>
        <input
          style={inputSm}
          type="date"
          value={form.expected_date || ""}
          onChange={(e) => setForm({ ...form, expected_date: e.target.value })}
        />
      </td>
      <td style={td}>
        <input
          style={inputSm}
          value={form.tracking_no || ""}
          onChange={(e) => setForm({ ...form, tracking_no: e.target.value })}
        />
      </td>
      <td style={td}>
        <label style={{ fontSize: 12, display: "flex", gap: 4, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={!!form.purchased}
            onChange={(e) => setForm({ ...form, purchased: e.target.checked })}
          />
          Purchased
        </label>
        <label style={{ fontSize: 12, display: "flex", gap: 4, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={form.received === "Yes"}
            onChange={(e) => setForm({ ...form, received: e.target.checked ? "Yes" : "No" })}
          />
          Delivered
        </label>
      </td>
      <td style={td}>
        <button onClick={save} disabled={saving} style={btnSm}>
          {saving ? "Saving…" : "Save"}
        </button>{" "}
        <button onClick={() => setEditing(false)} style={btnSm}>
          Cancel
        </button>
      </td>
    </tr>
  );
}

const td = { padding: "8px 10px", fontSize: 13, verticalAlign: "top" };
const inputSm = { width: "100%", fontSize: 13, padding: "4px 6px" };
const btnSm = { fontSize: 12, padding: "3px 8px" };
