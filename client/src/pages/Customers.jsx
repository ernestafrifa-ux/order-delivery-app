import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", location: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", location: "", notes: "" });
  const [editSaving, setEditSaving] = useState(false);

  function load() {
    api.getCustomers().then(setCustomers).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.createCustomer(form);
      setForm({ name: "", phone: "", location: "", notes: "" });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setEditForm({ name: c.name || "", phone: c.phone || "", location: c.location || "", notes: c.notes || "" });
  }

  async function saveEdit(id) {
    if (!editForm.name.trim()) return;
    setEditSaving(true);
    try {
      await api.updateCustomer(id, editForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(c) {
    if (!confirm(`Delete ${c.name} and all their orders? This can't be undone.`)) return;
    try {
      await api.deleteCustomer(c.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Customers</h1>
          <p style={{ color: "#64748b", marginTop: 4 }}>Everyone you take orders from.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "+ New Customer"}</button>
      </div>

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
          }}
        >
          <input
            placeholder="Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <input
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button type="submit" disabled={saving} style={{ gridColumn: "1 / -1", justifySelf: "start" }}>
            {saving ? "Saving…" : "Save Customer"}
          </button>
        </form>
      )}

      <input
        placeholder="Search customers…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12, width: 280 }}
      />

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left" }}>
              <th style={th}>Name</th>
              <th style={th}>Phone</th>
              <th style={th}>Orders</th>
              <th style={th}>Items</th>
              <th style={th}>Pending Delivery</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) =>
              editingId === c.id ? (
                <tr key={c.id} style={{ borderTop: "1px solid #eef2f7", background: "#fafaff" }}>
                  <td style={td}>
                    <input
                      style={inputSm}
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Name *"
                    />
                  </td>
                  <td style={td}>
                    <input
                      style={inputSm}
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Phone"
                    />
                  </td>
                  <td style={td} colSpan={2}>
                    <input
                      style={inputSm}
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="Location"
                    />
                  </td>
                  <td style={td}>
                    <input
                      style={inputSm}
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      placeholder="Notes"
                    />
                  </td>
                  <td style={td}>
                    <button onClick={() => saveEdit(c.id)} disabled={editSaving} style={btnSm}>
                      {editSaving ? "Saving…" : "Save"}
                    </button>{" "}
                    <button onClick={() => setEditingId(null)} style={btnSm}>
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={c.id} style={{ borderTop: "1px solid #eef2f7" }}>
                  <td style={td}>{c.name}</td>
                  <td style={td}>{c.phone || "—"}</td>
                  <td style={td}>{c.order_count}</td>
                  <td style={td}>{c.item_count}</td>
                  <td style={td}>
                    {c.pending_delivery > 0 ? (
                      <span style={{ color: "#b45309", fontWeight: 600 }}>{c.pending_delivery}</span>
                    ) : (
                      "0"
                    )}
                  </td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <Link to={`/customers/${c.id}`}>View →</Link>{" "}
                    <button onClick={() => startEdit(c)} style={btnSm}>
                      Edit
                    </button>{" "}
                    <button onClick={() => handleDelete(c)} style={{ ...btnSm, color: "#b91c1c" }}>
                      Delete
                    </button>
                  </td>
                </tr>
              )
            )}
            {filtered.length === 0 && (
              <tr>
                <td style={td} colSpan={6}>
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = { padding: "10px 14px", fontSize: 13, color: "#475569" };
const td = { padding: "10px 14px", fontSize: 14 };
const inputSm = { width: "100%", fontSize: 13, padding: "4px 6px" };
const btnSm = { fontSize: 12, padding: "3px 8px" };
